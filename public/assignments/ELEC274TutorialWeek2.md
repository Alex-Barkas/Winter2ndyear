# ELEC 274: Tutorial 2

**Background/Preparation**:
*   **Q1**: Review *Chapter 2, Slide 22*.
*   **Q2**: Examine the first three columns of the table on *Slide 2* of the additional material on signed number representation.
*   **Q3**: Review the loop examples in *Tutorial 1* and the `CalcAvg()` subroutine in the *Design, Implementation, and Testing* document.

---

### Question 1: Compiler Automation & Assembly Generation
Assume a software program has four global variables $W, X, Y, Z$. Consider the high-level pseudocode assignment:

$$ W = X + Y + Z $$

To understand how compilers generate low-level hardware code from high-level code, follow these steps:

1.  **Expression Tree**: Generate an expression tree for the assignment statement.
2.  **Register Allocation Plan**:
    *   Annotate nodes with register identifiers ($R_x$) to plan usage.
    *   **Constraint**: Avoid using $R0$ and $R1$. Start allocation with $R2$.
3.  **Code Generation**:
    *   Traverse the annotated tree to write the sequence of generic RISC instructions.
    *   Reflect the desired order of operations and planned register usage.
4.  **Execution Trace**:
    *   **Memory Context**: Assume variables are word-sized and located in memory with initial values:
        *   $W = 9$ (Initially)
        *   $X = 3$
        *   $Y = 2$
        *   $Z = 1$
    *   **Trace**: Draw a simple diagram showing the contents of relevant processor registers and memory locations after execution.

> **Extension**: Using the instructor's documentation, write a complete Nios II assembly program for this example. Use data directives for integers and reserve space for $W$. Test using the Web-based simulator.

---

### Question 2: Number Representation
Consider the decimal value **106**.

Without a calculator, convert this value into:
1.  **Binary** representation.
2.  **Hexadecimal** representation.

*Hint: Use subtraction of powers of the relevant target base.*

---

### Question 3: Loop Transformations
Consider pseudocode for a `for` loop summing an array, using an integer index $i$ and loops from a lower to upper bound.

Perform the following progression of transformations:

1.  **For $\to$ While (Index-based)**:
    *   Transform the `for` loop into a `while` loop.
    *   Retain the index variable $i$ and array access syntax `[...]`.

2.  **While (Index) $\to$ While (Pointer)**:
    *   Remove the index variable $i$.
    *   **Initialize**:
        *   A *pointer* to the start of the array.
        *   A *counter* for the number of elements (derived from bounds).
    *   **Loop Logic**: Increment the pointer and decrement the counter.

3.  **While (Pointer) $\to$ Do..While (Pointer)**:
    *   Transform into a `do..while` loop (assuming the array has at least one element).

> The final form aligns with low-level assembly patterns seen in *Chapter 2, Slide 40* and the course programming guidelines.
