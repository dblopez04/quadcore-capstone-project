const mockUserModel = {
    findOne: jest.fn(),
    update: jest.fn(),
};

const mockPasswordResetTokenModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
};

const mockSendPasswordResetEmail = jest.fn();
const mockPasswordResetService = {
    buildPasswordResetUrl: jest.fn(),
    generatePasswordResetToken: jest.fn(),
    getPasswordResetTtlMinutes: jest.fn(),
    hashPasswordResetToken: jest.fn(),
};

jest.mock("bcrypt", () => ({
    hashSync: jest.fn((value) => `hashed:${value}`),
    compareSync: jest.fn(),
}), { virtual: true });

jest.mock("jsonwebtoken", () => ({
    sign: jest.fn(() => "jwt-token"),
    verify: jest.fn(),
}), { virtual: true });

jest.mock("sequelize", () => ({
    Op: {
        gt: Symbol("gt"),
    },
}), { virtual: true });

jest.mock("../app/models", () => ({
    User: mockUserModel,
    PasswordResetToken: mockPasswordResetTokenModel,
}));

jest.mock("../app/config/cookie.config", () => ({
    getAccessCookieOptions: jest.fn(() => ({})),
    getRefreshCookieOptions: jest.fn(() => ({})),
    getClearCookieOptions: jest.fn(() => ({ path: "/" })),
}));

jest.mock("../app/services/email.service", () => ({
    sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

jest.mock("../app/services/passwordReset.service", () => mockPasswordResetService);

const controller = require("../app/controllers/auth.controller");

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        cookiesCleared: [],
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
        send(payload) {
            this.body = payload;
            return this;
        },
        clearCookie(name, options) {
            this.cookiesCleared.push({ name, options });
            return this;
        },
        cookie() {
            return this;
        },
    };
}

describe("auth.controller password reset flow", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.PASSWORD_RESET_URL_BASE = "https://meangreenguide.com/reset-password";
    });

    it("returns the generic forgot-password response when the email does not exist", async () => {
        mockUserModel.findOne.mockResolvedValue(null);
        const req = { body: { email: "missing@example.com" } };
        const res = createResponse();

        await controller.forgotPassword(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            message: "If an account exists for that email, a reset link has been sent.",
        });
        expect(mockPasswordResetTokenModel.create).not.toHaveBeenCalled();
        expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("creates a reset record and sends an email for an existing user", async () => {
        const destroy = jest.fn().mockResolvedValue(undefined);
        mockUserModel.findOne.mockResolvedValue({
            user_id: "user-123",
            email: "student@example.com",
        });
        mockPasswordResetService.generatePasswordResetToken.mockReturnValue("raw-reset-token");
        mockPasswordResetService.hashPasswordResetToken.mockReturnValue("hashed-reset-token");
        mockPasswordResetService.getPasswordResetTtlMinutes.mockReturnValue(15);
        mockPasswordResetService.buildPasswordResetUrl.mockReturnValue(
            "https://meangreenguide.com/reset-password?token=raw-reset-token"
        );
        mockPasswordResetTokenModel.update.mockResolvedValue([1]);
        mockPasswordResetTokenModel.create.mockResolvedValue({ destroy });
        mockSendPasswordResetEmail.mockResolvedValue({ id: "email_123" });

        const req = { body: { email: "student@example.com" } };
        const res = createResponse();

        await controller.forgotPassword(req, res);

        expect(res.statusCode).toBe(200);
        expect(mockPasswordResetTokenModel.create).toHaveBeenCalledWith({
            user_id: "user-123",
            token_hash: "hashed-reset-token",
            expires_at: expect.any(Date),
        });
        expect(mockSendPasswordResetEmail).toHaveBeenCalledWith({
            to: "student@example.com",
            resetUrl: "https://meangreenguide.com/reset-password?token=raw-reset-token",
            ttlMinutes: 15,
        });
        expect(destroy).not.toHaveBeenCalled();
    });

    it("updates the password, invalidates reset tokens, and clears auth cookies", async () => {
        const userUpdate = jest.fn().mockResolvedValue(undefined);
        mockPasswordResetService.hashPasswordResetToken.mockReturnValue("hashed-reset-token");
        mockPasswordResetTokenModel.findOne.mockResolvedValue({
            user_id: "user-123",
        });
        mockUserModel.findOne.mockResolvedValue({
            user_id: "user-123",
            update: userUpdate,
        });
        mockPasswordResetTokenModel.update.mockResolvedValue([1]);

        const req = {
            body: {
                token: "raw-reset-token",
                newPassword: "newPassword123",
            },
        };
        const res = createResponse();

        await controller.resetPassword(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ message: "Password reset successful" });
        expect(userUpdate).toHaveBeenCalledTimes(1);
        const [updatedUserPayload] = userUpdate.mock.calls[0];
        expect(updatedUserPayload.refresh_token).toBeNull();
        expect(updatedUserPayload.password_hash).toBe("hashed:newPassword123");
        expect(mockPasswordResetTokenModel.update).toHaveBeenCalledWith(
            { used_at: expect.any(Date) },
            {
                where: {
                    user_id: "user-123",
                    used_at: null,
                },
            }
        );
        expect(res.cookiesCleared).toEqual([
            { name: "accessToken", options: { path: "/" } },
            { name: "refreshToken", options: { path: "/" } },
        ]);
    });
});
