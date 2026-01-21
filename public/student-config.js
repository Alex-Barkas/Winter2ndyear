const STUDENT_DATA = {
    gradingSchemes: {
        "MTHE 281": {
            components: [
                { name: "Homework", weight: 10, count: 10, score: null },
                { name: "Midterm", weight: 50, count: 2, score: null },
                { name: "Final Exam", weight: 40, count: 1, score: null }
            ]
        },
        "MTHE 212": {
            components: [
                { name: "Quizzes", weight: 40, count: 5, dropLowest: 1, score: null },
                { name: "Final Exam", weight: 60, count: 1, score: null }
            ]
        },
        "MREN 230": {
            components: [
                { name: "Assignments", weight: 5, count: 10, score: null },
                { name: "In-class Tests", weight: 40, count: 2, score: null },
                { name: "Labs", weight: 15, count: 2, score: null },
                { name: "Final Exam", weight: 40, count: 1, score: null } // Must pass to pass course
            ]
        },
        "MECH 210": {
            components: [
                { name: "Active Learning Assignments", weight: 10, count: 10, score: null },
                { name: "Lab Assignments", weight: 30, count: 6, score: null },
                { name: "Quizzes", weight: 5, count: 4, score: null },
                { name: "Midterm Exam", weight: 20, count: 1, score: null },
                { name: "Final Exam", weight: 35, count: 1, score: null } // Must pass (>50%) to pass course
            ]
        },
        "ENPH 225": {
            components: [
                { name: "Quizzes", weight: 30, count: 3, score: null },
                { name: "Assignments", weight: 12, count: 8, dropLowest: 2, score: null }, // Best 6 of 8
                { name: "In-Class Group Work", weight: 9, count: 12, dropLowest: 3, score: null }, // Best 9 of 12
                { name: "FeedbackFruits Group Work", weight: 18, count: 12, dropLowest: 3, score: null }, // Best 9 of 12 (Assumed same count logic as In-Class)
                { name: "Final Exam", weight: 31, count: 1, score: null }
            ]
        }
    },
    courses: [
        {
            code: "MTHE 281",
            name: "Introduction To Real Analysis",
            notes: "pdfs/MTHE281.pdf",
            textbook: "textbooks/MTHE 281 Abbott - Understanding Analysis.pdf",
            solutions: "textbooks/MTHE 281 Understanding Analysis Solutions.pdf",
            assignments: "assignments.html?course=MTHE 281",
            image: "course_images/mthe281.png"
        },
        {
            code: "MTHE 212",
            name: "Linear Algebra II",
            notes: "pdfs/MTHE212.pdf",
            textbook: "textbooks/LADR4e.pdf",
            solutions: "textbooks/MTHE212-Textbook-Solutions.pdf",
            assignments: "assignments.html?course=MTHE 212",
            image: "course_images/mthe212.png"
        },
        {
            code: "MREN 230",
            name: "Thermodynamics",
            notes: "pdfs/MREN230.pdf",
            assignments: "assignments.html?course=MREN 230",
            image: "course_images/mren230.png"
        },
        {
            code: "MECH 210",
            name: "Circuits",
            notes: "https://drive.google.com/file/d/12C3rud5o0KoWcUNGl0hZ1TxdCPE6trTH/view",
            assignments: "assignments.html?course=MECH 210",
            image: "course_images/mech210.png"
        },
        {
            code: "ENPH 225",
            name: "Mechanics",
            notes: "pdfs/ENPH225.pdf",
            textbook: "https://api.pageplace.de/preview/DT0400.9781292088785_A26856513/preview-9781292088785_A26856513.pdf",
            assignments: "assignments.html?course=ENPH 225",
            image: "course_images/enph225.png"
        }
    ],
    assignments: [
        // --- MTHE 281 ---
        { id: "mthe281-h1", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 1", date: "2026-01-16", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "assignments/MTHE281Homework1.pdf" } },
        { id: "mthe281-h2", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 2", date: "2026-01-23", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h3", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 3", date: "2026-01-30", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h4", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 4", date: "2026-02-06", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-m1", course: "MTHE 281", category: "MIDTERM", title: "Midterm 1", date: "2026-02-11", time: "13:30", status: "UPCOMING", score: null, details: { type: "text", content: "No calculators allowed." } },
        { id: "mthe281-h5", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 5", date: "2026-02-27", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h6", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 6", date: "2026-03-06", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h7", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 7", date: "2026-03-13", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-m2", course: "MTHE 281", category: "MIDTERM", title: "Midterm 2", date: "2026-03-18", time: "13:30", status: "UPCOMING", score: null, details: { type: "text", content: "No calculators allowed." } },
        { id: "mthe281-h8", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 8", date: "2026-03-27", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h9", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 9", date: "2026-04-03", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h10", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 10", date: "2026-04-10", time: "23:59", status: "PENDING", score: null, details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },

        // --- MTHE 212 ---
        { id: "mthe212-q1", course: "MTHE 212", category: "QUIZ", title: "Quiz 1", date: "2026-01-23", time: "10:30", status: "UPCOMING", score: null, details: { type: "text", content: "In-class quiz (50 mins)." } },
        { id: "mthe212-q2", course: "MTHE 212", category: "QUIZ", title: "Quiz 2", date: "2026-02-06", time: "10:30", status: "UPCOMING", score: null, details: { type: "text", content: "In-class quiz (50 mins)." } },
        { id: "mthe212-q3", course: "MTHE 212", category: "QUIZ", title: "Quiz 3", date: "2026-02-27", time: "10:30", status: "UPCOMING", score: null, details: { type: "text", content: "In-class quiz (50 mins)." } },
        { id: "mthe212-q4", course: "MTHE 212", category: "QUIZ", title: "Quiz 4", date: "2026-03-13", time: "10:30", status: "UPCOMING", score: null, details: { type: "text", content: "In-class quiz (50 mins)." } },
        { id: "mthe212-q5", course: "MTHE 212", category: "QUIZ", title: "Quiz 5", date: "2026-03-27", time: "10:30", status: "UPCOMING", score: null, details: { type: "text", content: "In-class quiz (50 mins)." } },

        // --- MECH 210 ---
        // MECH 210 Quizzes (Fridays 4:30 PM)
        { id: "mech210-q1", course: "MECH 210", category: "QUIZ", title: "Quiz 1", date: "2026-01-23", time: "16:30", status: "UPCOMING", score: null, details: { type: "text", content: "Week 3" } },
        { id: "mech210-q2", course: "MECH 210", category: "QUIZ", title: "Quiz 2", date: "2026-02-06", time: "16:30", status: "UPCOMING", score: null, details: { type: "text", content: "Week 5" } },
        { id: "mech210-q3", course: "MECH 210", category: "QUIZ", title: "Quiz 3", date: "2026-03-13", time: "16:30", status: "UPCOMING", score: null, details: { type: "text", content: "Week 9" } },
        { id: "mech210-q4", course: "MECH 210", category: "QUIZ", title: "Quiz 4", date: "2026-03-27", time: "16:30", status: "UPCOMING", score: null, details: { type: "text", content: "Week 11" } },

        // MECH 210 Pre-lab Quizzes (Every 2 weeks starting Jan 18)
        { id: "mech210-prelab1", course: "MECH 210", category: "QUIZ", title: "Pre-lab Quiz 1", date: "2026-01-18", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Pre-lab for Lab 1" } },
        { id: "mech210-prelab2", course: "MECH 210", category: "QUIZ", title: "Pre-lab Quiz 2", date: "2026-02-01", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Pre-lab for Lab 2" } },
        { id: "mech210-prelab3", course: "MECH 210", category: "QUIZ", title: "Pre-lab Quiz 3", date: "2026-02-15", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Pre-lab for Lab 3" } },
        { id: "mech210-prelab4", course: "MECH 210", category: "QUIZ", title: "Pre-lab Quiz 4", date: "2026-03-01", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Pre-lab for Lab 4" } },
        { id: "mech210-prelab5", course: "MECH 210", category: "QUIZ", title: "Pre-lab Quiz 5", date: "2026-03-15", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Pre-lab for Lab 5" } },
        { id: "mech210-prelab6", course: "MECH 210", category: "QUIZ", title: "Pre-lab Quiz 6", date: "2026-03-29", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Pre-lab for Lab 6" } },

        // MECH 210 Midterm
        { id: "mech210-mid", course: "MECH 210", category: "MIDTERM", title: "Midterm Exam", date: "2026-02-24", time: "08:30", status: "UPCOMING", score: null, details: { type: "text", content: "During Lecture (Biosci 1101)" } },

        // MECH 210 MECHMania
        { id: "mech210-mania", course: "MECH 210", category: "ASSIGNMENT", title: "MECHMania 2.0", date: "2026-03-30", time: "08:30", status: "UPCOMING", score: null, details: { type: "text", content: "Week 12 Activity" } },


        // --- ENPH 225 ---
        // Assignments (Wednesdays 4:30 PM)
        { id: "enph225-a1", course: "ENPH 225", category: "ASSIGNMENT", title: "Assignment 1", date: "2026-01-14", time: "16:30", status: "PENDING", score: null, details: { type: "text", content: "Week 2" } },
        { id: "enph225-a2", course: "ENPH 225", category: "ASSIGNMENT", title: "Assignment 2", date: "2026-01-21", time: "16:30", status: "PENDING", score: null, details: { type: "text", content: "Week 3" } },
        { id: "enph225-a3", course: "ENPH 225", category: "ASSIGNMENT", title: "Assignment 3", date: "2026-01-28", time: "16:30", status: "PENDING", score: null, details: { type: "text", content: "Week 4" } },
        { id: "enph225-a4", course: "ENPH 225", category: "ASSIGNMENT", title: "Assignment 4", date: "2026-02-11", time: "16:30", status: "PENDING", score: null, details: { type: "text", content: "Week 6" } },
        { id: "enph225-a5", course: "ENPH 225", category: "ASSIGNMENT", title: "Assignment 5", date: "2026-02-25", time: "16:30", status: "PENDING", score: null, details: { type: "text", content: "Week 7" } },
        { id: "enph225-a6", course: "ENPH 225", category: "ASSIGNMENT", title: "Assignment 6", date: "2026-03-11", time: "16:30", status: "PENDING", score: null, details: { type: "text", content: "Week 9" } },
        { id: "enph225-a7", course: "ENPH 225", category: "ASSIGNMENT", title: "Assignment 7", date: "2026-03-18", time: "16:30", status: "PENDING", score: null, details: { type: "text", content: "Week 10" } },
        { id: "enph225-a8", course: "ENPH 225", category: "ASSIGNMENT", title: "Assignment 8", date: "2026-04-01", time: "16:30", status: "PENDING", score: null, details: { type: "text", content: "Week 12" } },

        // ENPH 225 Quizzes (Tuesdays 7:00 PM)
        { id: "enph225-q1", course: "ENPH 225", category: "QUIZ", title: "Quiz 1", date: "2026-02-03", time: "19:00", status: "UPCOMING", score: null, details: { type: "text", content: "Week 5 (In-Person)" } },
        { id: "enph225-q2", course: "ENPH 225", category: "QUIZ", title: "Quiz 2", date: "2026-03-03", time: "19:00", status: "UPCOMING", score: null, details: { type: "text", content: "Week 8 (In-Person)" } },
        { id: "enph225-q3", course: "ENPH 225", category: "QUIZ", title: "Quiz 3", date: "2026-03-24", time: "19:00", status: "UPCOMING", score: null, details: { type: "text", content: "Week 11 (In-Person)" } },


        // --- MREN 230 ---
        // 10 Assignments (Assuming Weekly due dates, specifics not listed, defaulting to Fridays for now)
        // Syllabus says "Assigned online via OnQ". Creating placeholders.
        { id: "mren230-a1", course: "MREN 230", category: "ASSIGNMENT", title: "Assignment 1", date: "2026-01-18", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Check OnQ" } },
        { id: "mren230-a2", course: "MREN 230", category: "ASSIGNMENT", title: "Assignment 2", date: "2026-01-25", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Check OnQ" } },
        { id: "mren230-a3", course: "MREN 230", category: "ASSIGNMENT", title: "Assignment 3", date: "2026-02-01", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Check OnQ" } },
        { id: "mren230-a4", course: "MREN 230", category: "ASSIGNMENT", title: "Assignment 4", date: "2026-02-08", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Check OnQ" } },
        { id: "mren230-a5", course: "MREN 230", category: "ASSIGNMENT", title: "Assignment 5", date: "2026-02-15", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Check OnQ" } },
        { id: "mren230-a6", course: "MREN 230", category: "ASSIGNMENT", title: "Assignment 6", date: "2026-03-01", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Check OnQ" } },
        { id: "mren230-a7", course: "MREN 230", category: "ASSIGNMENT", title: "Assignment 7", date: "2026-03-08", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Check OnQ" } },
        { id: "mren230-a8", course: "MREN 230", category: "ASSIGNMENT", title: "Assignment 8", date: "2026-03-15", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Check OnQ" } },
        { id: "mren230-a9", course: "MREN 230", category: "ASSIGNMENT", title: "Assignment 9", date: "2026-03-22", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Check OnQ" } },
        { id: "mren230-a10", course: "MREN 230", category: "ASSIGNMENT", title: "Assignment 10", date: "2026-03-29", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Check OnQ" } },

        // MREN 230 Tests
        { id: "mren230-m1", course: "MREN 230", category: "MIDTERM", title: "Midterm 1", date: "2026-02-12", time: "18:00", status: "UPCOMING", score: null, details: { type: "text", content: "Details on Rooms and Formula sheets TBA" } },
        { id: "mren230-m2", course: "MREN 230", category: "MIDTERM", title: "Midterm 2", date: "2026-03-26", time: "18:00", status: "UPCOMING", score: null, details: { type: "text", content: "Details on Rooms and Formula sheets TBA" } },

        // Labs: Lab I (W5-8), Lab II (W9-12)
        { id: "mren230-lab1", course: "MREN 230", category: "LAB", title: "Lab 1", date: "2026-02-13", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Lab Report I" } },
        { id: "mren230-lab2", course: "MREN 230", category: "LAB", title: "Lab 2", date: "2026-03-27", time: "23:59", status: "PENDING", score: null, details: { type: "text", content: "Lab Report II" } },


        // --- PERSONAL & OTHER ---
        {
            id: "tuition-w26",
            course: "FINANCE",
            category: "REMINDER",
            title: "Pay Tuition",
            date: "2026-01-10",
            time: "10:00",
            status: "PENDING",
            score: null,
            details: { type: "text", content: "Pay Winter 2026 Tuition via Online Banking." }
        }
    ]
};

// Expose globally for modules
window.STUDENT_DATA = STUDENT_DATA;
window.data = STUDENT_DATA; // Backwards compatibility if needed
