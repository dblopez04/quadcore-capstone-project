const {
    buildWeeklyEventDigestEmail,
} = require("../app/services/email.service");

describe("email.service weekly digest email", () => {
    it("builds escaped weekly digest email content", () => {
        const message = buildWeeklyEventDigestEmail({
            eventType: "Arts",
            frontendUrl: "https://meangreenguide.com/",
            events: [
                {
                    title: "Gallery <Night>",
                    description: "Paint & snacks",
                    start_date_time: "2026-04-22T18:00:00Z",
                    Location: { name: "Union" },
                    details: { room_detail: "Room 123" },
                },
            ],
        });

        expect(message.subject).toBe("Mean Green Guide weekly Arts events");
        expect(message.html).toContain("Gallery &lt;Night&gt;");
        expect(message.html).toContain("Paint &amp; snacks");
        expect(message.html).toContain("https://meangreenguide.com/events");
        expect(message.text).toContain("Gallery <Night>");
    });
});
