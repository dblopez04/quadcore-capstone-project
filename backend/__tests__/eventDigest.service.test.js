const mockSubscriptionFindAll = jest.fn();
const mockEventFindAll = jest.fn();
const mockSendWeeklyEventDigestEmail = jest.fn();

jest.mock("sequelize", () => ({
    Op: {
        and: Symbol("and"),
        gte: Symbol("gte"),
        in: Symbol("in"),
        lt: Symbol("lt"),
    },
}), { virtual: true });

jest.mock("../app/models", () => ({
    EventCategorySubscription: {
        findAll: mockSubscriptionFindAll,
    },
    Event: {
        findAll: mockEventFindAll,
    },
    EventDetail: {},
    Location: {},
    User: {},
}));

jest.mock("../app/services/email.service", () => ({
    sendWeeklyEventDigestEmail: mockSendWeeklyEventDigestEmail,
}));

const { sendWeeklyCategoryDigests } = require("../app/services/eventDigest.service");

describe("eventDigest.service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("sends a weekly digest for subscriptions with upcoming events", async () => {
        const update = jest.fn().mockResolvedValue(undefined);
        mockSubscriptionFindAll.mockResolvedValue([
            {
                subscription_id: "sub-1",
                user_id: "user-1",
                event_type: "Arts",
                User: { user_id: "user-1", email: "student@example.com" },
                update,
            },
        ]);
        mockEventFindAll.mockResolvedValue([
            {
                event_id: "event-1",
                title: "Gallery Night",
                start_date_time: new Date("2026-04-22T18:00:00Z"),
            },
        ]);
        mockSendWeeklyEventDigestEmail.mockResolvedValue({ id: "email-1" });

        const summary = await sendWeeklyCategoryDigests({
            now: new Date("2026-04-21T12:00:00Z"),
            frontendUrl: "https://meangreenguide.com",
        });

        expect(summary.sent).toBe(1);
        expect(summary.failed).toBe(0);
        expect(mockSendWeeklyEventDigestEmail).toHaveBeenCalledWith({
            to: "student@example.com",
            eventType: "Arts",
            events: expect.any(Array),
            frontendUrl: "https://meangreenguide.com",
        });
        expect(update).toHaveBeenCalledWith({
            last_digest_sent_at: new Date("2026-04-21T12:00:00Z"),
        });
    });

    it("skips subscriptions with no upcoming events", async () => {
        mockSubscriptionFindAll.mockResolvedValue([
            {
                subscription_id: "sub-1",
                user_id: "user-1",
                event_type: "Sports",
                User: { user_id: "user-1", email: "student@example.com" },
                update: jest.fn(),
            },
        ]);
        mockEventFindAll.mockResolvedValue([]);

        const summary = await sendWeeklyCategoryDigests({
            now: new Date("2026-04-21T12:00:00Z"),
        });

        expect(summary.skipped).toBe(1);
        expect(summary.results[0].reason).toBe("no upcoming events");
        expect(mockSendWeeklyEventDigestEmail).not.toHaveBeenCalled();
    });

    it("reports dry-run sends without emailing or updating subscriptions", async () => {
        const update = jest.fn();
        mockSubscriptionFindAll.mockResolvedValue([
            {
                subscription_id: "sub-1",
                user_id: "user-1",
                event_type: "Academic",
                User: { user_id: "user-1", email: "student@example.com" },
                update,
            },
        ]);
        mockEventFindAll.mockResolvedValue([
            {
                event_id: "event-1",
                title: "Study Session",
                start_date_time: new Date("2026-04-22T18:00:00Z"),
            },
        ]);

        const summary = await sendWeeklyCategoryDigests({
            now: new Date("2026-04-21T12:00:00Z"),
            dryRun: true,
        });

        expect(summary.would_send).toBe(1);
        expect(summary.sent).toBe(0);
        expect(summary.results[0].status).toBe("would_send");
        expect(mockSendWeeklyEventDigestEmail).not.toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
    });
});
