const STUDENT_DATA = {
    planning: [
        {
            name: "Weekly Schedule",
            link: "schedule/schedule.pdf",
            action: "PDF"
        },
        {
            name: "Upcoming Dates",
            link: "#",
            action: "VIEW"
        },
        {
            name: "Grade Dashboard",
            link: "grades.html",
            action: "VIEW"
        }
    ],
    gradingSchemes: {
        "MTHE 281": {
            // Option 1 & 2 logic would be handled in a more advanced calculator.
            // For now, listing the components for the Grade Dashboard.
            components: [
                { name: "Homework", weight: 10, count: 10 },
                { name: "Midterm 1", weight: 25, count: 1 },
                { name: "Midterm 2", weight: 25, count: 1 },
                { name: "Final Exam", weight: 40, count: 1 }
            ]
        },
        "ENPH 239": {
            components: [
                { name: "Math Diagnostics", weight: 5, count: 1 },
                { name: "Weekly Quizzes", weight: 15, count: 12 },
                { name: "Assignments", weight: 40, count: 3 },
                { name: "Final Exam", weight: 40, count: 1 }
            ]
        },
        "MTHE 212": {
            components: [
                { name: "Quizzes", weight: 40, count: 5, dropLowest: 1 },
                { name: "Final Exam", weight: 60, count: 1 }
            ]
        },
        "CMPE 212": {
            components: [
                { name: "Lab 1", weight: 5 },
                { name: "Lab 2", weight: 5 },
                { name: "Lab 3", weight: 5 },
                { name: "Lab 4", weight: 5 },
                { name: "Lab 5", weight: 5 },
                { name: "Lab 6", weight: 5 },
                { name: "Lab 7", weight: 5 },
                { name: "Lab 8", weight: 5 },
                { name: "Test 1", weight: 15 },
                { name: "Test 2", weight: 15 },
                { name: "Final Exam", weight: 30 } // Adjusted to 30 to sum to 100 based on syllabus md
            ]
        },
        "ELEC 274": {
            components: [
                { name: "Laboratories", weight: 20, count: 4 },
                { name: "Midterm Quiz", weight: 20, count: 1 },
                { name: "Final Exam", weight: 60, count: 1 }
            ]
        }
    },
    courses: [
        {
            code: "MTHE 281",
            name: "Introduction To Real Analysis",
            notes: "pdfs/MTHE281.pdf",
            textbook: "textbooks/MTHE281 Abbott - Understanding Analysis.pdf",
            solutions: "textbooks/MTHE 281 Understanding Analysis Solutions.pdf",
            assignments: "assignments.html?course=MTHE 281"
        },
        {
            code: "ENPH 239",
            name: "Electromagnetism",
            notes: "pdfs/ENPH239.pdf",
            textbook: "textbooks/ENPH 239 David J. Griffiths-Introduction to Electrodynamics-Addison-Wesley (2012).pdf",
            solutions: "textbooks/ENPH 239 solutions_manual.pdf",
            assignments: "assignments.html?course=ENPH 239"
        },
        {
            code: "MTHE 212",
            name: "Linear Algebra II",
            notes: "pdfs/MTHE212.pdf",
            textbook: "textbooks/MTHE 212 Textbook - [3rd ed.] LADR by Sheldon A.pdf",
            solutions: "textbooks/MTHE212-Textbook-Solutions.pdf",
            assignments: "assignments.html?course=MTHE 212"
        },
        {
            code: "CMPE 212",
            name: "Intro Computing Science II",
            notes: "pdfs/CMPE212.pdf",
            textbook: "textbooks/CMPE 212 Textbook - [5th ed.] Addison Wesley - Absolute Java.pdf",
            assignments: "assignments.html?course=CMPE 212"
        },
        {
            code: "ELEC 274",
            name: "Computer Architecture",
            notes: "pdfs/ELEC274.pdf",
            textbook: "textbooks/ELEC 274 Textbook - [6th ed.] Computer Organization and Embedded Systems by ya boi Manjikian himself.pdf",
            assignments: "assignments.html?course=ELEC 274"
        }
    ],
    assignments: [
        // --- CMPE 212 ---
        { id: "cmpe-l1", course: "CMPE 212", category: "LAB", title: "Lab 1", date: "2026-01-13", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 1" } },
        { id: "cmpe-l2", course: "CMPE 212", category: "LAB", title: "Lab 2", date: "2026-01-20", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 2" } },
        { id: "cmpe-l3", course: "CMPE 212", category: "LAB", title: "Lab 3", date: "2026-01-27", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 3" } },
        { id: "cmpe-t1", course: "CMPE 212", category: "MIDTERM", title: "Test 1", date: "2026-02-05", time: "09:30", status: "UPCOMING", details: { type: "text", content: "Midterm Test 1" } },
        { id: "cmpe-l4", course: "CMPE 212", category: "LAB", title: "Lab 4", date: "2026-02-10", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 4" } },
        // Reading Week Feb 13-22
        { id: "cmpe-l5", course: "CMPE 212", category: "LAB", title: "Lab 5", date: "2026-02-24", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 5" } },
        { id: "cmpe-l6", course: "CMPE 212", category: "LAB", title: "Lab 6", date: "2026-03-10", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 6" } },
        { id: "cmpe-t2", course: "CMPE 212", category: "MIDTERM", title: "Test 2", date: "2026-03-12", time: "09:30", status: "UPCOMING", details: { type: "text", content: "Midterm Test 2" } },
        { id: "cmpe-l7", course: "CMPE 212", category: "LAB", title: "Lab 7", date: "2026-03-17", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 7" } },
        { id: "cmpe-l8", course: "CMPE 212", category: "LAB", title: "Lab 8", date: "2026-03-31", time: "14:30", status: "PENDING", details: { type: "text", content: "Comp Sci Lab 8" } },
        { id: "cmpe-fin", course: "CMPE 212", category: "FINAL", title: "Final Exam", date: "2026-04-30", time: "00:00", status: "UPCOMING", details: { type: "text", content: "Date TBD" } },

        // --- ELEC 274 ---
        { id: "elec-l1", course: "ELEC 274", category: "LAB", title: "Lab 1", date: "2026-01-12", time: "18:30", status: "PENDING", details: { type: "text", content: "Week 2 Lab" } },
        { id: "elec-l2", course: "ELEC 274", category: "LAB", title: "Lab 2", date: "2026-01-26", time: "18:30", status: "PENDING", details: { type: "text", content: "Week 4 Lab" } },
        { id: "elec-t1", course: "ELEC 274", category: "MIDTERM", title: "Midterm Quiz", date: "2026-02-06", time: "13:30", status: "UPCOMING", details: { type: "text", content: "Friday, Feb 6 @ 1:30PM" } },
        { id: "elec-l3", course: "ELEC 274", category: "LAB", title: "Lab 3", date: "2026-03-09", time: "18:30", status: "PENDING", details: { type: "text", content: "Week 9 Lab" } },
        { id: "elec-l4", course: "ELEC 274", category: "LAB", title: "Lab 4", date: "2026-03-23", time: "18:30", status: "PENDING", details: { type: "text", content: "Week 11 Lab" } },
        { id: "elec-fin", course: "ELEC 274", category: "FINAL", title: "Final Exam", date: "2026-04-30", time: "00:00", status: "UPCOMING", details: { type: "text", content: "Date TBD" } },

        // --- OTHER COURSES (Retained) ---
        // --- MTHE 281 ---
        { id: "mthe281-h1", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 1", date: "2026-01-16", time: "23:59", status: "PENDING", details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h2", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 2", date: "2026-01-23", time: "23:59", status: "PENDING", details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h3", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 3", date: "2026-01-30", time: "23:59", status: "PENDING", details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h4", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 4", date: "2026-02-06", time: "23:59", status: "PENDING", details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },

        { id: "mthe281-m1", course: "MTHE 281", category: "MIDTERM", title: "Midterm 1", date: "2026-02-11", time: "13:30", status: "UPCOMING", details: { type: "text", content: "No calculators allowed." } },

        // Skip Week of Feb 9 (Midterm) -> No Fri Feb 13 HW
        // Skip Week of Feb 16 (Reading Week) -> No Fri Feb 20 HW

        { id: "mthe281-h5", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 5", date: "2026-02-27", time: "23:59", status: "PENDING", details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h6", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 6", date: "2026-03-06", time: "23:59", status: "PENDING", details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h7", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 7", date: "2026-03-13", time: "23:59", status: "PENDING", details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },

        { id: "mthe281-m2", course: "MTHE 281", category: "MIDTERM", title: "Midterm 2", date: "2026-03-18", time: "13:30", status: "UPCOMING", details: { type: "text", content: "No calculators allowed." } },

        // Skip Week of Mar 16 (Midterm) -> No Fri Mar 20 HW

        { id: "mthe281-h8", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 8", date: "2026-03-27", time: "23:59", status: "PENDING", details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h9", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 9", date: "2026-04-03", time: "23:59", status: "PENDING", details: { type: "pdf", url: "pdfs/MTHE281.pdf" } },
        { id: "mthe281-h10", course: "MTHE 281", category: "ASSIGNMENT", title: "Homework 10", date: "2026-04-10", time: "23:59", status: "PENDING", details: { type: "pdf", url: "pdfs/MTHE281.pdf" } }, // Tentative date
        {
            id: "2",
            course: "ENPH 239",
            category: "LAB",
            title: "Lab 1",
            date: "2026-01-25",
            time: "16:00",
            status: "PENDING",
            details: { type: "text", content: "Complete the pre-lab questions before entering the lab." }
        },
        {
            id: "4",
            course: "MTHE 212",
            category: "QUIZ",
            title: "Quiz 1",
            date: "2026-01-30",
            time: "09:30",
            status: "UPCOMING",
            details: { type: "text", content: "Topics: Vector Spaces, Subspaces, Linear Independence." }
        },
        {
            id: "5",
            course: "ELEC 274",
            category: "MIDTERM",
            title: "Midterm Exam",
            date: "2026-02-05",
            time: "14:00",
            status: "UPCOMING",
            details: { type: "text", content: "Location: Walter Light Hall 205. Bring ID." }
        },
        {
            id: "6",
            course: "PERSONAL",
            category: "REMINDER",
            title: "Rent Payment",
            date: "2026-02-01",
            time: "09:00",
            status: "PENDING",
            details: { type: "text", content: "Pay $850 to Landlord via E-Transfer." }
        },
        {
            id: "7",
            course: "CAREER",
            category: "REMINDER",
            title: "RBC Internship Application",
            date: "2026-01-31",
            time: "23:59",
            status: "PENDING",
            details: { type: "link", url: "https://jobs.rbc.com", label: "Apply Here" }
        }
    ]
};
