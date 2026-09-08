// classesStart anchors the "Week N" labels on the assignments page;
// readingWeek is the Smith Engineering fall reading week (confirmed by
// cross-referencing MECH 330's explicit assignment dates against its
// week-numbered assessment table: the 15-day A2->A3 gap is the break).
export default {
    termRange: {
        start: "2026-09-01",
        end: "2026-12-31",
        classesStart: "2026-09-08",
        readingWeek: { start: "2026-10-12", end: "2026-10-18" }
    },
    gradingSchemes: {
        "MECH 328": {
            components: [
                { name: "In-Lecture Questions", weight: 5, count: 1, score: null },
                { name: "Active Learning (ICAs)", weight: 20, count: 5, score: null },
                { name: "Progress Report", weight: 5, count: 1, score: null },
                { name: "Final Report", weight: 10, count: 1, score: null },
                { name: "Midterm 1", weight: 15, count: 1, score: null },
                { name: "Midterm 2", weight: 15, count: 1, score: null },
                { name: "Final Exam", weight: 30, count: 1, score: null }
            ]
        },
        "MECH 330": {
            components: [
                { name: "Traditional Assignments", weight: 5, count: 6, dropLowest: 1, score: null },
                { name: "Jupyter Assignments", weight: 5, count: 3, dropLowest: 1, score: null },
                { name: "Midterm 1", weight: 25, count: 1, score: null },
                { name: "Midterm 2", weight: 25, count: 1, score: null },
                { name: "Final Exam", weight: 40, count: 1, score: null }
            ]
        },
        "MECH 321": {
            components: [
                { name: "Report 1", weight: 4, count: 1, score: null },
                { name: "Report 2", weight: 6, count: 1, score: null },
                { name: "Report 3", weight: 10, count: 1, score: null },
                { name: "Midterm 1", weight: 20, count: 1, score: null },
                { name: "Midterm 2", weight: 20, count: 1, score: null },
                { name: "Final Exam", weight: 40, count: 1, score: null }
            ]
        },
        "MECH 398": {
            components: [
                { name: "Tutorials", weight: 12, count: 4, score: null },
                { name: "Pre-Lab Quizzes", weight: 8, count: 4, score: null },
                { name: "In-Lab TA Assessment", weight: 8, count: 4, score: null },
                { name: "Virtual Team Notebook", weight: 8, count: 1, score: null },
                { name: "Lab Reports", weight: 64, count: 4, score: null }
            ]
        },
        "MTHE 351": {
            components: [
                { name: "Homework", weight: 10, count: 10, score: null },
                { name: "Quiz 1", weight: 20, count: 1, score: null },
                { name: "Quiz 2", weight: 20, count: 1, score: null },
                { name: "Final Exam", weight: 50, count: 1, score: null }
            ]
        },
        "MTHE 326": {
            components: [
                { name: "In-Class Quizzes", weight: 10, count: 12, dropLowest: 2, score: null },
                { name: "Midterm Test 1", weight: 20, count: 1, score: null },
                { name: "Midterm Test 2", weight: 20, count: 1, score: null },
                { name: "Final Exam", weight: 50, count: 1, score: null }
            ]
        }
    },
    courses: [
        {
            code: "MECH 328",
            name: "Dynamics and Vibrations",
            notes: "/syllabus/MECH328_F2026_Syllabus.pdf",
            assignments: "/fall2026/assignments?course=MECH 328",
            image: "/course_images/mech328.png"
        },
        {
            code: "MECH 330",
            name: "Applied Thermodynamics II",
            notes: "/syllabus/MECH330_F2026_Syllabus_Sept4.pdf",
            assignments: "/fall2026/assignments?course=MECH 330",
            image: "/course_images/mech330.png"
        },
        {
            code: "MECH 321",
            name: "Solid Mechanics II",
            notes: "/syllabus/SmithEngineering_MECH321_F2026_Syllabus.pdf",
            assignments: "/fall2026/assignments?course=MECH 321",
            image: "/course_images/mech321.png"
        },
        {
            code: "MECH 398",
            name: "Mechanical Engineering Laboratory I",
            notes: "/syllabus/MECH398_CIS_Fall2026.pdf",
            assignments: "/fall2026/assignments?course=MECH 398",
            image: "/course_images/mech398.png"
        },
        {
            code: "MTHE 351",
            name: "Probability I",
            notes: "/syllabus/syllabus-M351-F26.pdf",
            assignments: "/fall2026/assignments?course=MTHE 351",
            image: "/course_images/mthe351.png"
        },
        {
            code: "MTHE 326",
            name: "Functions of a Complex Variable",
            notes: "/syllabus/MTHE 326 - Course Outline F26.pdf",
            assignments: "/fall2026/assignments?course=MTHE 326",
            image: "/course_images/mthe326.png"
        }
    ],
    assignments: [
        // --- MECH 328 (Dynamics and Vibrations) ---
        // In-lecture questions have no fixed dates (ongoing, best-20-of-all-lectures) - grading scheme only.
        // ICAs are due 3 days after the Active Learning Session; Section 2 meets Tuesdays, so due dates fall on Friday.
        { id: "mech328-ica1", course: "MECH 328", category: "TUTORIAL", title: "ICA 1 - Vectors, DOF, and Simulation", date: "2026-09-18", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Week 2. Section 2 (Tuesday Active Learning Session). Worth ~4% (part of the 20% ICA total)." } },
        { id: "mech328-ica2", course: "MECH 328", category: "TUTORIAL", title: "ICA 2 - Vector Derivatives and Kinetics", date: "2026-10-02", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Week 4. Section 2 (Tuesday Active Learning Session). Worth ~4% (part of the 20% ICA total)." } },
        { id: "mech328-ica3", course: "MECH 328", category: "TUTORIAL", title: "ICA 3 - Multibody Planar Motion", date: "2026-10-23", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Week 6. Section 2 (Tuesday Active Learning Session). Worth ~4% (part of the 20% ICA total)." } },
        { id: "mech328-ica4", course: "MECH 328", category: "TUTORIAL", title: "ICA 4 - Energy", date: "2026-11-06", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Week 8. Section 2 (Tuesday Active Learning Session). Worth ~4% (part of the 20% ICA total)." } },
        { id: "mech328-ica5", course: "MECH 328", category: "TUTORIAL", title: "ICA 5 - 3D Motion", date: "2026-11-27", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Week 11. Section 2 (Tuesday Active Learning Session). Worth ~4% (part of the 20% ICA total)." } },
        { id: "mech328-progress", course: "MECH 328", category: "ASSIGNMENT", title: "Final Project - Progress Report", date: "2026-11-15", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Week 9. Worth 5% (part of the 15% Final Project). Short progress update on the 2D planar design project." } },
        { id: "mech328-final-report", course: "MECH 328", category: "ASSIGNMENT", title: "Final Project - Final Report", date: "2026-12-06", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Week 12. Worth 10% (part of the 15% Final Project)." } },
        { id: "mech328-mid1", course: "MECH 328", category: "MIDTERM", title: "Midterm 1", date: "2026-11-01", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 7 - exact date/time/location TBD via onQ. Worth 15%." } },
        { id: "mech328-mid2", course: "MECH 328", category: "MIDTERM", title: "Midterm 2", date: "2026-12-06", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 12 - exact date/time/location TBD via onQ. Worth 15%." } },
        { id: "mech328-final", course: "MECH 328", category: "FINAL", title: "Final Exam", date: "2026-12-10", time: "09:00", status: "UPCOMING", score: null, details: { type: "text", content: "Placeholder date - actual date/time set by OUR Exams Office (Dec 10-23 exam period). Worth 30%. Must pass to pass the course." } },

        // --- MECH 330 (Applied Thermodynamics II) ---
        { id: "mech330-a1", course: "MECH 330", category: "ASSIGNMENT", title: "Traditional Assignment 1 (A1)", date: "2026-09-21", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Worth 1% (top 5 of 6 counted). Graded for original content." } },
        { id: "mech330-j1", course: "MECH 330", category: "ASSIGNMENT", title: "Jupyter Assignment 1 (J1)", date: "2026-09-28", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Worth 2.5% (top 2 of 3 counted). Python/Cantera notebook, may be done with a fixed partner." } },
        { id: "mech330-a2", course: "MECH 330", category: "ASSIGNMENT", title: "Traditional Assignment 2 (A2)", date: "2026-10-05", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Worth 1% (top 5 of 6 counted)." } },
        { id: "mech330-a3", course: "MECH 330", category: "ASSIGNMENT", title: "Traditional Assignment 3 (A3)", date: "2026-10-20", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Due Tuesday (not the usual Monday). Worth 1% (top 5 of 6 counted)." } },
        { id: "mech330-j2", course: "MECH 330", category: "ASSIGNMENT", title: "Jupyter Assignment 2 (J2)", date: "2026-10-26", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Worth 2.5% (top 2 of 3 counted)." } },
        { id: "mech330-mid1", course: "MECH 330", category: "MIDTERM", title: "Midterm 1", date: "2026-10-22", time: "18:00", status: "UPCOMING", score: null, details: { type: "text", content: "Thursday, October 22, 6 PM. Worth 25%. Closed book, formula sheet + steam tables provided." } },
        { id: "mech330-a4", course: "MECH 330", category: "ASSIGNMENT", title: "Traditional Assignment 4 (A4)", date: "2026-11-02", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Worth 1% (top 5 of 6 counted)." } },
        { id: "mech330-j3", course: "MECH 330", category: "ASSIGNMENT", title: "Jupyter Assignment 3 (J3)", date: "2026-11-09", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Worth 2.5% (top 2 of 3 counted)." } },
        { id: "mech330-a5", course: "MECH 330", category: "ASSIGNMENT", title: "Traditional Assignment 5 (A5)", date: "2026-11-16", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Worth 1% (top 5 of 6 counted)." } },
        { id: "mech330-mid2", course: "MECH 330", category: "MIDTERM", title: "Midterm 2", date: "2026-11-25", time: "18:00", status: "UPCOMING", score: null, details: { type: "text", content: "Wednesday, November 25, 6 PM. Worth 25%. Closed book, formula sheet + steam tables provided." } },
        { id: "mech330-a6", course: "MECH 330", category: "ASSIGNMENT", title: "Traditional Assignment 6 (A6)", date: "2026-12-07", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Worth 1% (top 5 of 6 counted)." } },
        { id: "mech330-final", course: "MECH 330", category: "FINAL", title: "Final Exam", date: "2026-12-10", time: "09:00", status: "UPCOMING", score: null, details: { type: "text", content: "Placeholder date - actual date/time set by OUR Exams Office (Dec 10-23 exam period). Worth 40%. Closed book, formula sheet + steam tables provided." } },

        // --- MECH 321 (Solid Mechanics II) ---
        { id: "mech321-report1", course: "MECH 321", category: "ASSIGNMENT", title: "Design Project - Report 1", date: "2026-09-20", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Week 2. Worth 4%. Analyze the given structure under specified load." } },
        { id: "mech321-mid1", course: "MECH 321", category: "MIDTERM", title: "Midterm 1", date: "2026-10-11", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 5 - exact date/time TBD via onQ. Worth 20%. Closed book." } },
        { id: "mech321-report2", course: "MECH 321", category: "ASSIGNMENT", title: "Design Project - Report 2", date: "2026-11-08", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Week 8. Worth 6%." } },
        { id: "mech321-mid2", course: "MECH 321", category: "MIDTERM", title: "Midterm 2", date: "2026-11-15", time: "23:59", status: "UPCOMING", score: null, details: { type: "text", content: "Week 9 - exact date/time TBD via onQ. Worth 20%. Closed book." } },
        { id: "mech321-report3", course: "MECH 321", category: "ASSIGNMENT", title: "Design Project - Report 3", date: "2026-12-06", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Week 12. Worth 10%. Modify the structure and validate the modification." } },
        { id: "mech321-final", course: "MECH 321", category: "FINAL", title: "Final Exam", date: "2026-12-10", time: "09:00", status: "UPCOMING", score: null, details: { type: "text", content: "Placeholder date - actual date/time set by OUR Exams Office (Dec 10-23 exam period). Worth 40%. Closed book." } },

        // --- MECH 398 (Mechanical Engineering Laboratory I) ---
        // Dates from the official MECH 398 Fall 2026 group schedule (group E-H, section 002 Tutorial / 003 Laboratory).
        // Pre-lab quiz due times are approximate (must be completed before the lab starts); in-lab assessment is a TA-assigned team grade at the end of the session.
        { id: "mech398-tut1", course: "MECH 398", category: "TUTORIAL", title: "Tutorial - Refrigeration", date: "2026-09-15", time: "14:20", status: "PENDING", score: null, details: { type: "text", content: "Tue 1:30-2:20PM, Mitchell 215-235. Worth 3% (part of the 12% Tutorials total)." } },
        { id: "mech398-prelab1", course: "MECH 398", category: "QUIZ", title: "Pre-Lab Quiz - Refrigeration", date: "2026-09-18", time: "14:00", status: "PENDING", score: null, details: { type: "text", content: "Must be completed before the Fri 2:30PM lab starts. Worth 2% (part of the 8% Pre-Lab Quizzes total)." } },
        { id: "mech398-lab1", course: "MECH 398", category: "LAB", title: "In-Lab Assessment - Refrigeration", date: "2026-09-18", time: "16:20", status: "PENDING", score: null, details: { type: "text", content: "Fri 2:30-4:20PM, Sutherland 101. TA-assigned team grade. Worth 2% (part of the 8% In-Lab TA Assessment total)." } },
        { id: "mech398-report1", course: "MECH 398", category: "LAB", title: "Lab Report - Refrigeration", date: "2026-09-28", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Due 10 days after the lab session. Worth 16% (part of the 64% Lab Reports total)." } },

        { id: "mech398-tut2", course: "MECH 398", category: "TUTORIAL", title: "Tutorial - Flow in Pipes", date: "2026-10-06", time: "14:20", status: "PENDING", score: null, details: { type: "text", content: "Tue 1:30-2:20PM, Mitchell 215-235. Worth 3% (part of the 12% Tutorials total)." } },
        { id: "mech398-prelab2", course: "MECH 398", category: "QUIZ", title: "Pre-Lab Quiz - Flow in Pipes", date: "2026-10-09", time: "14:00", status: "PENDING", score: null, details: { type: "text", content: "Must be completed before the Fri 2:30PM lab starts. Worth 2% (part of the 8% Pre-Lab Quizzes total)." } },
        { id: "mech398-lab2", course: "MECH 398", category: "LAB", title: "In-Lab Assessment - Flow in Pipes", date: "2026-10-09", time: "16:20", status: "PENDING", score: null, details: { type: "text", content: "Fri 2:30-4:20PM, Sutherland 101. TA-assigned team grade. Worth 2% (part of the 8% In-Lab TA Assessment total)." } },
        { id: "mech398-report2", course: "MECH 398", category: "LAB", title: "Lab Report - Flow in Pipes", date: "2026-10-19", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Due 10 days after the lab session. Worth 16% (part of the 64% Lab Reports total)." } },

        { id: "mech398-tut3", course: "MECH 398", category: "TUTORIAL", title: "Tutorial - Vertical Jump Height", date: "2026-11-03", time: "14:20", status: "PENDING", score: null, details: { type: "text", content: "Tue 1:30-2:20PM, Mitchell 215-235. Worth 3% (part of the 12% Tutorials total)." } },
        { id: "mech398-prelab3", course: "MECH 398", category: "QUIZ", title: "Pre-Lab Quiz - Vertical Jump Height", date: "2026-11-06", time: "14:00", status: "PENDING", score: null, details: { type: "text", content: "Must be completed before the Fri 2:30PM lab starts. Worth 2% (part of the 8% Pre-Lab Quizzes total)." } },
        { id: "mech398-lab3", course: "MECH 398", category: "LAB", title: "In-Lab Assessment - Vertical Jump Height", date: "2026-11-06", time: "16:20", status: "PENDING", score: null, details: { type: "text", content: "Fri 2:30-4:20PM, Sutherland 101. TA-assigned team grade. Worth 2% (part of the 8% In-Lab TA Assessment total)." } },
        { id: "mech398-report3", course: "MECH 398", category: "LAB", title: "Lab Report - Vertical Jump Height", date: "2026-11-16", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Due 10 days after the lab session. Worth 16% (part of the 64% Lab Reports total)." } },

        { id: "mech398-tut4", course: "MECH 398", category: "TUTORIAL", title: "Tutorial - Structures", date: "2026-11-24", time: "14:20", status: "PENDING", score: null, details: { type: "text", content: "Tue 1:30-2:20PM, Mitchell 215-235. Worth 3% (part of the 12% Tutorials total)." } },
        { id: "mech398-prelab4", course: "MECH 398", category: "QUIZ", title: "Pre-Lab Quiz - Structures", date: "2026-11-27", time: "14:00", status: "PENDING", score: null, details: { type: "text", content: "Must be completed before the Fri 2:30PM lab starts. Worth 2% (part of the 8% Pre-Lab Quizzes total)." } },
        { id: "mech398-lab4", course: "MECH 398", category: "LAB", title: "In-Lab Assessment - Structures", date: "2026-11-27", time: "16:20", status: "PENDING", score: null, details: { type: "text", content: "Fri 2:30-4:20PM, Sutherland 101. TA-assigned team grade. Worth 2% (part of the 8% In-Lab TA Assessment total)." } },
        { id: "mech398-report4", course: "MECH 398", category: "LAB", title: "Lab Report - Structures", date: "2026-12-07", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Due 10 days after the lab session. Worth 16% (part of the 64% Lab Reports total)." } },

        { id: "mech398-notebook", course: "MECH 398", category: "ASSIGNMENT", title: "Virtual Team Notebook", date: "2026-12-12", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Due within 5 days of the last lab report submission. Worth 8%. Shared cloud document with your team and TAs." } },

        // --- MTHE 351 (Probability I) ---
        // 10 homework assignments (10% total via Crowdmark) have no dates in the syllabus - grading scheme only for those.
        { id: "mthe351-quiz1", course: "MTHE 351", category: "QUIZ", title: "Quiz 1", date: "2026-10-09", time: "09:30", status: "UPCOMING", score: null, details: { type: "text", content: "Week 5, Friday 9:30-10:20. Worth 20%. No makeups." } },
        { id: "mthe351-quiz2", course: "MTHE 351", category: "QUIZ", title: "Quiz 2", date: "2026-11-04", time: "13:30", status: "UPCOMING", score: null, details: { type: "text", content: "Week 8, Wednesday 1:30-2:20. Worth 20%. No makeups." } },
        { id: "mthe351-final", course: "MTHE 351", category: "FINAL", title: "Final Exam", date: "2026-12-10", time: "09:00", status: "UPCOMING", score: null, details: { type: "text", content: "Placeholder date - run by the Exams Office (Dec 10-23 exam period). Worth 50%." } },

        // --- MTHE 326 / MATH 326 (Functions of a Complex Variable) ---
        // 12 unannounced pop-up quizzes (best 10 count) and both midterms (dates/times TBA, to be
        // announced within the first two weeks of term via onQ) have no fixed dates yet - grading scheme only for those.
        { id: "mthe326-final", course: "MTHE 326", category: "FINAL", title: "Final Exam", date: "2026-12-10", time: "09:00", status: "UPCOMING", score: null, details: { type: "text", content: "Placeholder date - scheduled by the Office of the University Registrar (Dec 10-23 exam period). Worth 50%. Cumulative, 180 minutes." } }
    ]
};
