// Data Definitions for Assembly Explorer: High-Level Constructs (x86-64 vs AArch64)
const assemblyData = {
    'Assignments & Memory': [
        {
            id: 'Variable Assignment (Load/Store)',
            x86: '# x86-64: mov handles everything\nmovq $5, %rax        # Immediate to Reg\nmovq %rax, (%rbx)    # Reg to Memory\nmovq (%rbx), %rcx    # Memory to Reg',
            arm: '# ARM64: Strict Load/Store\nmov x0, #5           # Immediate to Reg\nstr x0, [x1]         # Reg to Memory (Store)\nldr x2, [x1]         # Memory to Reg (Load)',
            desc: 'CISC vs RISC philosophy. x86-64 uses a universal "mov" instruction that can interact directly with memory. AArch64 is a strict Load/Store architecture; "mov" only works between registers or immediates, requiring dedicated "ldr" (load) and "str" (store) instructions for memory.'
        },
        {
            id: 'Array Access (arr[i] = 3)',
            x86: '# %rax = arr base, %rcx = index (i)\nmovq $3, (%rax, %rcx, 8)',
            arm: '// x0 = arr base, x1 = index (i)\nmov x2, #3\nstr x2, [x0, x1, lsl #3]',
            desc: 'To evaluate "arr[i] = 3" for 64-bit (8-byte) integers, x86-64 natively calculates "Base + (Index * 8)" right inside the mov instruction. AArch64 achieves this by applying a Logical Shift Left (LSL #3, which multiplies by 8) to the index register during the store operation.'
        }
    ],
    'Math & Arithmetic': [
        {
            id: 'Basic Arithmetic (a = b + c)',
            x86: '# Destroys one of the operands\nmovq %rbx, %rax  # Copy b into a\naddq %rcx, %rax  # a = a + c',
            arm: '# Preserves all sources\nadd x0, x1, x2   # x0 = x1 + x2',
            desc: 'x86-64 arithmetic instructions typically use a 2-operand format where the destination is also one of the sources, destroying the original value. AArch64 uses a 3-operand format, which directly mirrors high-level assignments (a = b + c) without needing extra copy instructions.'
        },
        {
            id: 'Division (a = b / c)',
            x86: '# %rax = b, %rcx = c\ncqto             # Sign-extend %rax into %rdx:%rax\nidivq %rcx       # Divide 128-bit %rdx:%rax by %rcx\n# Quotient is in %rax, Remainder in %rdx',
            arm: '// x0 = b, x1 = c\nsdiv x2, x0, x1  // x2 = x0 / x1',
            desc: 'High-level division exposes CISC legacy quirks. x86-64 requires the dividend to be sign-extended across two 64-bit registers (using cqto) before dividing, hardcoding the output to %rax and %rdx. AArch64 performs standard 3-operand signed division (sdiv) using any available registers.'
        }
    ],
    'If-Statements & Branching': [
        {
            id: 'Standard If-Condition',
            x86: 'cmpq %rbx, %rax  # Compare a and b\njne .L_ELSE      # Jump if Not Equal\n# ... if block ...\n.L_ELSE:',
            arm: 'cmp x0, x1       # Compare a and b\nb.ne .L_ELSE     # Branch if Not Equal\n// ... if block ...\n.L_ELSE:',
            desc: 'Both architectures use a Compare (cmp) instruction to set hardware condition flags (Zero, Negative, etc.), followed by a conditional jump/branch. x86-64 uses "Jump" (j-prefix), while AArch64 uses "Branch" (b-prefix).'
        },
        {
            id: 'If (x == 0) Optimization',
            x86: 'testq %rax, %rax # Bitwise AND on itself\nje .L_ZERO       # Jump if Equal (Zero Flag set)',
            arm: 'cbz x0, .L_ZERO  # Compare and Branch on Zero',
            desc: 'AArch64 includes a specific RISC optimization: "cbz" (Compare and Branch on Zero). It evaluates the register and executes the branch in a single instruction without touching the global condition flags. x86-64 requires two steps (usually "test" followed by "je").'
        }
    ],
    'Loops (For / While)': [
        {
            id: 'Loop Counter Increment',
            x86: '.L_LOOP:\n  # ... loop body ...\n  incq %rax      # i++\n  cmpq $10, %rax # i < 10?\n  jl .L_LOOP     # Jump if less',
            arm: '.L_LOOP:\n  // ... loop body ...\n  add x0, x0, #1 // i++\n  cmp x0, #10    // i < 10?\n  b.lt .L_LOOP   // Branch if less',
            desc: 'x86-64 includes complex, dedicated instructions for looping, such as "inc" (increment) and "dec" (decrement). AArch64 adheres to RISC principles by omitting specialized incrementers, simply using standard "add" and "sub" instructions with immediate values.'
        }
    ],
    'Function Calls & Params': [
        {
            id: 'Parameter Passing',
            x86: '# Up to 6 args in registers:\n# %rdi, %rsi, %rdx, %rcx, %r8, %r9\nmovq $1, %rdi\nmovq $2, %rsi\ncall my_func',
            arm: '# Up to 8 args in registers:\n# x0, x1, x2, x3, x4, x5, x6, x7\nmov x0, #1\nmov x1, #2\nbl my_func',
            desc: 'In 64-bit architectures, both favor passing arguments via registers rather than the stack (unlike older 32-bit x86). x86-64 passes the first 6 arguments in specific registers. AArch64 passes the first 8 arguments in registers x0-x7. Both return values in the first register (%rax and x0, respectively).'
        },
        {
            id: 'Call and Return (The Link Register)',
            x86: 'call my_func   # Pushes return address to stack\n# ... inside function ...\nret            # Pops address from stack',
            arm: 'bl my_func     # Saves return address to x30\n// ... inside function ...\nret            # Branches to address in x30',
            desc: 'When x86-64 executes a "call", the hardware automatically writes the return address to memory (the stack). AArch64 uses "bl" (Branch with Link), which saves the return address into a dedicated CPU register (x30 - The Link Register). This RISC design avoids a slow memory write unless the function calls another function.'
        }
    ],
    'Stack Management': [
        {
            id: 'Push, Pop, and Stack Alignment',
            x86: 'pushq %rbx     # sp = sp - 8, store rbx\npopq %rbx      # load rbx, sp = sp + 8\n\n# Stack aligns to 8 bytes generally',
            arm: 'str x19, [sp, #-16]!  // Pre-index: sp-=16, store\nldr x19, [sp], #16    // Post-index: load, sp+=16\n\n// Hardware strictly enforces 16-byte alignment',
            desc: 'x86-64 has dedicated hardware-managed "push" and "pop" instructions that automatically manipulate the Stack Pointer (%rsp). AArch64 requires software-managed stacks using standard load/store instructions with pre- or post-indexing. Furthermore, AArch64 strictly enforces a 16-byte stack alignment, meaning you usually push/pop registers in pairs (using stp/ldp).'
        }
    ],
    'Instruction Dictionary (1-to-1)': [
        {
            id: '64-bit Data Move',
            x86: 'movq %rbx, %rax\nmovq (%rbx), %rax\nmovq %rax, (%rbx)',
            arm: 'mov x0, x1\nldr x0, [x1]\nstr x1, [x0]',
            desc: 'x86-64 uses the "q" (quadword) suffix for 64-bit moves across registers and memory. AArch64 uses 64-bit "x" registers, but restricts "mov" to registers, requiring "ldr" (load) and "str" (store) for memory.'
        },
        {
            id: '64-bit Arithmetic',
            x86: 'addq %rbx, %rax\nsubq %rbx, %rax',
            arm: 'add x0, x0, x1\nsub x0, x0, x1',
            desc: 'x86-64 relies on a 2-operand structure where the destination is modified (e.g., %rax = %rax + %rbx). AArch64 explicitly lists three 64-bit operands (Destination, Source 1, Source 2).'
        },
        {
            id: 'Multiplication & Division',
            x86: 'imulq %rbx, %rax\nidivq %rbx',
            arm: 'mul x0, x1, x2\nsdiv x0, x1, x2',
            desc: 'x86-64 signed division (idivq) is notoriously complex, implicitly storing the quotient in %rax and the remainder in %rdx. AArch64 simplifies this with standard 3-operand instructions for signed divide (sdiv) and multiply (mul).'
        },
        {
            id: 'Logical XOR & NOT',
            x86: 'xorq %rbx, %rax\nnotq %rax',
            arm: 'eor x0, x1, x2\nmvn x0, x1',
            desc: 'Exclusive OR is "xorq" in x86-64 and "eor" in AArch64. For bitwise NOT, x86-64 uses "notq" on a single destination, whereas AArch64 uses "mvn" (Move NOT), which calculates the complement and moves it to a destination.'
        },
        {
            id: 'Bitwise Shifts',
            x86: 'salq %cl, %rax\nshrq %cl, %rax',
            arm: 'lsl x0, x1, #v\nlsr x0, x1, #v',
            desc: 'Both architectures offer left/right and logical/arithmetic shifts. x86-64 typically uses sal/shl and sar/shr. AArch64 uses Explicit Logical Shift Left (lsl) and Logical Shift Right (lsr).'
        },
        {
            id: 'Unconditional & Equality Jumps',
            x86: 'jmp .Label\nje .Label',
            arm: 'b .Label\nb.eq .Label',
            desc: 'x86-64 uses "Jump" (jmp) and "Jump if Equal" (je). AArch64 uses "Branch" (b) and "Branch if Equal" (b.eq). Both rely on the Zero Flag being set by a previous CMP instruction to trigger the equality jump.'
        }
    ]
};