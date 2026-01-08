const TRACKER_DATA = {
    // "Blocks" are structured study sessions you want to effectively time and manage.
    // They are permanently stored here.
    blocks: [
        {
            id: "b1",
            title: "Prove Theorem 3.2 (Bolzano-Weierstrass)",
            course: "MTHE 281",
            duration: 45, // minutes
            notes: "Review the epsilon-delta definitions first. Check the textbook page 45.",
            status: "TODO" // TODO, DONE
        },
        {
            id: "b2",
            title: "Watch Week 2 Lecture Videos",
            course: "ENPH 239",
            duration: 60,
            notes: "Focus on Gauss's Law applications. Take notes on the sphere example.",
            status: "TODO"
        }
    ],

    // "Ideas" are random thoughts or things to remember.
    // You can add to this list to permanently store them in Git.
    ideas: [
        "Need to buy new graph paper.",
        "Idea for the summer: Automate the coffee machine.",
        "Remember to email Professor about the research opportunity."
    ]
};
