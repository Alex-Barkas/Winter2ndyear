// See student-config-winter2026.js for why this is a direct window assignment
// and not a top-level `const`.
window.STUDENT_DATA = {
    // No reading week in the summer term, so the key is simply omitted.
    termRange: {
        start: "2026-05-01",
        end: "2026-08-15",
        classesStart: "2026-05-04"
    },
    gradingSchemes: {
        "APSC 221": {
            components: [
                { name: "Quiz", weight: 20, count: 10, score: null },
                { name: "Assignment 1", weight: 5, count: 1, score: null },
                { name: "Assignment 2", weight: 15, count: 3, score: null },
                { name: "Midterm", weight: 20, count: 1, score: null },
                { name: "Final Exam", weight: 40, count: 1, score: null }
            ]
        }
    },
    courses: [
        {
            code: "APSC 221",
            name: "Economics and Business Practices in Engineering",
            notes: "/syllabus/APSC 221 - Syllabus S26 - V3.pdf",
            assignments: "/summer2026/assignments.html?course=APSC 221",
            image: "/course_images/apsc221_modern_economics.png"
        }
    ],
    assignments: [
        // --- APSC 221 Quizzes (10, 2% each, due 23:59 ET) ---
        { id: "apsc221-q0", course: "APSC 221", category: "QUIZ", title: "Q0: Course Introduction", date: "2026-05-10", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 1. Two attempts allowed, highest score counts." } },
        { id: "apsc221-q1", course: "APSC 221", category: "QUIZ", title: "Q1: Chapter 1, 2, 3", date: "2026-05-17", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 2. Two attempts allowed, highest score counts." } },
        { id: "apsc221-q2", course: "APSC 221", category: "QUIZ", title: "Q2: Chapter 4, 5", date: "2026-05-24", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 3. Two attempts allowed, highest score counts." } },
        { id: "apsc221-q3", course: "APSC 221", category: "QUIZ", title: "Q3: Chapter 6", date: "2026-05-31", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 4. Two attempts allowed, highest score counts." } },
        { id: "apsc221-q4", course: "APSC 221", category: "QUIZ", title: "Q4: Chapter 7, 8", date: "2026-06-07", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 5. Two attempts allowed, highest score counts." } },
        { id: "apsc221-q5", course: "APSC 221", category: "QUIZ", title: "Q5: Chapter 9, 10", date: "2026-06-14", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 6. Two attempts allowed, highest score counts." } },
        { id: "apsc221-q6", course: "APSC 221", category: "QUIZ", title: "Q6: Chapter 11, Change Management", date: "2026-06-28", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 8. Two attempts allowed, highest score counts." } },
        { id: "apsc221-q7", course: "APSC 221", category: "QUIZ", title: "Q7: Chapter 12, 13", date: "2026-07-05", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 9. Two attempts allowed, highest score counts." } },
        { id: "apsc221-q8", course: "APSC 221", category: "QUIZ", title: "Q8: Chapter 14, 15", date: "2026-07-19", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 10. Available Jul 12 until Jul 19. Two attempts allowed, highest score counts." } },
        { id: "apsc221-q9", course: "APSC 221", category: "QUIZ", title: "Q9: Chapter 16, Circular Economy", date: "2026-07-19", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 11. Two attempts allowed, highest score counts." } },

        // --- APSC 221 Assignments ---
        { id: "apsc221-a1", course: "APSC 221", category: "ASSIGNMENT", title: "Assignment 1", date: "2026-06-07", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Worth 5%. Submitted via OnQ assignment folder with signed cover page. 10%/day late penalty." } },
        { id: "apsc221-a2a", course: "APSC 221", category: "ASSIGNMENT", title: "Assignment 2 - Part A", date: "2026-07-14", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Part of Assignment 2 (15% total across Parts A/B/C). 10%/day late penalty." } },
        { id: "apsc221-a2b", course: "APSC 221", category: "ASSIGNMENT", title: "Assignment 2 - Part B", date: "2026-07-21", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Part of Assignment 2 (15% total across Parts A/B/C). 10%/day late penalty." } },
        { id: "apsc221-a2c", course: "APSC 221", category: "ASSIGNMENT", title: "Assignment 2 - Part C", date: "2026-07-28", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Part of Assignment 2 (15% total across Parts A/B/C). 10%/day late penalty." } },

        // --- APSC 221 Midterm & Final ---
        { id: "apsc221-mid", course: "APSC 221", category: "MIDTERM", title: "Midterm", date: "2026-06-21", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 7 (exact date/time TBD). ~90 min, online proctored, closed-book. Only a Casio 991 calculator permitted." } },
        { id: "apsc221-final", course: "APSC 221", category: "FINAL", title: "Final Exam", date: "2026-08-07", time: "09:00", status: "UPCOMING", score: null, details: { type: "text", content: "Placeholder date - actual date/time set by OUR Exams Office. Closed-book, covers all course material." } }
    ]
};

window.data = window.STUDENT_DATA; // Backwards compatibility if needed
