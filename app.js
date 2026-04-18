/**
 * Assembly Correlation Dashboard: x86-64 vs AArch64 (ARM64)
 * An interactive educational tool mapping instructions and architectural differences.
 */

// 1. Setup App (UI + State)
const categories = Object.keys(assemblyData);

const { state, ui } = WH.createApp({
    title: "Assembly Explorer: x86-64 vs ARM64",
    params: {
        category: { 
            value: categories[0], 
            options: categories,
            label: "Category"
        },
        instruction: {
            value: assemblyData[categories[0]][0].id,
            options: assemblyData[categories[0]].map(d => d.id),
            label: "Topic"
        }
    }
});

// State linkage: Sync Category -> Instruction List
state._subscribe((key, val) => {
    if (key === 'category') {
        const firstPair = assemblyData[val][0].id;
        state.instruction = firstPair;
        
        // Since the framework doesn't support dynamic dropdown options natively easily,
        // we manually update the DOM elements for the instruction dropdown if needed.
        // For a robust fix without altering widget-shell.js:
        setTimeout(() => {
            const selectLabels = Array.from(document.querySelectorAll('.xxs-row label'));
            const selectContainer = document.querySelectorAll('.xxs-select');
            // Assuming the second select is the Topic/Instruction one
            if (selectContainer.length > 1) {
                const sel = selectContainer[1];
                sel.innerHTML = '';
                assemblyData[val].forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.id;
                    opt.textContent = d.id;
                    sel.appendChild(opt);
                });
                sel.value = firstPair;
                
                // OVERRIDE: We must override the onchange event here.
                // The original widget-shell.js event listener is trapped in a closure 
                // containing only the options from the *first* category. 
                // Overriding ensures the state gets the actual new selection.
                sel.onchange = (e) => {
                    state.instruction = e.target.value;
                };
            }
        }, 0);
    }
});

// 3. Main Engine
WH.initCanvas('viz', (ctx) => {
    
    // Helper to draw a code block
    const drawCodeBlock = (title, code, x, y, w, h, color) => {
        ctx.save();
        ctx.fillStyle = WH.transparent(color, 0.1);
        ctx.strokeStyle = WH.getColor(color);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = WH.getColor('--on-surface-default');
        ctx.font = 'bold 16px monospace';
        ctx.fillText(title, x + 10, y + 25);
        
        ctx.font = '14px monospace';
        const lines = code.split('\n');
        lines.forEach((line, i) => {
            ctx.fillText(line, x + 10, y + 50 + (i * 20));
        });
        ctx.restore();
    };

    const drawRegister = (name, x, y, color) => {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = WH.transparent(color, 0.2);
        ctx.strokeStyle = WH.getColor(color);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x - 30, y - 15, 60, 30, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = WH.getColor('--on-surface-default');
        ctx.font = '12px monospace';
        ctx.fillText(name, x, y);
        ctx.restore();
    };

    return ({ width, height, time, state }) => {
        const cx = width / 2;
        const cy = height / 2;
        const cardWidth = Math.min(width * 0.4, 350);
        const padding = 40;

        // Get current data
        const currentCat = assemblyData[state.category];
        const item = currentCat.find(d => d.id === state.instruction) || currentCat[0];

        // Header HUD
        ui.setHUD([
            { label: "Category", value: state.category },
            { label: "Arch", value: item.type === 'unmatched' ? 'N/A' : 'CISC vs RISC' }
        ]);

        // Determine bottom coordinate for the split line
        let splitLineBottom = height - 100;
        if (item.type !== 'unmatched' && item.x86 && item.arm) {
            const linesX86 = item.x86.split('\n').length;
            const linesArm = item.arm.split('\n').length;
            const boxY = 120;
            const boxH = 50 + (Math.max(linesX86, linesArm) * 20) + 15;
            splitLineBottom = boxY + boxH + 15; // Stop gracefully above the description
        }

        // Background / Split Line
        ctx.strokeStyle = WH.getColor('--outline-variant');
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(cx, 100);
        ctx.lineTo(cx, splitLineBottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // Labels
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px "Google Sans"';
        ctx.fillStyle = WH.getColor('--primary');
        ctx.fillText('x86-64 (Intel/AMD)', cx - cardWidth/2 - padding, 80);
        ctx.fillStyle = WH.getColor('--chart-5');
        ctx.fillText('AArch64 (ARM)', cx + cardWidth/2 + padding, 80);
        ctx.restore();

        if (item.type === 'unmatched') {
            // Specialized view for Unmatched architecture features
            const boxY = 150;
            const boxH = height - 250;
            
            // Draw x86 list
            ctx.save();
            ctx.translate(cx - cardWidth - padding, boxY);
            item.x86Only.forEach((feat, i) => {
                ctx.drawTag(feat.op, 0, i * 80, '--primary');
                ctx.fillStyle = WH.getColor('--on-surface-variant');
                ctx.font = '13px "Google Sans"';
                ctx.fillText(feat.d, 0, i * 80 + 35);
            });
            ctx.restore();

            // Draw ARM list
            ctx.save();
            ctx.translate(cx + padding, boxY);
            item.armOnly.forEach((feat, i) => {
                ctx.drawTag(feat.op, 0, i * 80, '--chart-5');
                ctx.fillStyle = WH.getColor('--on-surface-variant');
                ctx.font = '13px "Google Sans"';
                ctx.fillText(feat.d, 0, i * 80 + 35);
            });
            ctx.restore();

        } else {
            // Instruction Correlation View
            const linesX86 = item.x86.split('\n').length;
            const linesArm = item.arm.split('\n').length;
            const boxY = 120;
            const boxH = 50 + (Math.max(linesX86, linesArm) * 20) + 15;

            // Syntax Blocks
            drawCodeBlock('Syntax', item.x86, cx - cardWidth - padding, boxY, cardWidth, boxH, '--primary');
            drawCodeBlock('Syntax', item.arm, cx + padding, boxY, cardWidth, boxH, '--chart-5');

            // Explanation Section
            const descY = boxY + boxH + 40;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = '16px "Google Sans"';
            ctx.fillStyle = WH.getColor('--on-surface-default');
            const words = item.desc.split(' ');
            let line = '';
            let lineCount = 0;
            words.forEach(word => {
                if ((line + word).length > 60) {
                    ctx.fillText(line, cx, descY + (lineCount * 25));
                    line = word + ' ';
                    lineCount++;
                } else {
                    line += word + ' ';
                }
            });
            ctx.fillText(line, cx, descY + (lineCount * 25));
            ctx.restore();

            // Visualization of Operands
            const vizY = descY + 120;
            const flowOffset = Math.sin(time * 2) * 10;

            if (item.type === '2-vs-3') {
                // x86: 2-operand
                drawRegister('Source', cx - cardWidth/2 - 100, vizY + 50, '--primary');
                drawRegister('Dest/Src', cx - cardWidth/2, vizY + 50, '--primary');
                ctx.drawArrow(cx - cardWidth/2 - 70, vizY + 50, 40 + flowOffset, 0, '--primary');
                ctx.fillStyle = WH.getColor('--on-surface-variant');
                ctx.font = 'italic 12px "Google Sans"';
                ctx.fillText('Result overwrites Dest', cx - cardWidth/2 - 50, vizY + 85);

                // ARM: 3-operand
                drawRegister('Src 1', cx + cardWidth/2 - 80, vizY, '--chart-5');
                drawRegister('Src 2', cx + cardWidth/2 - 80, vizY + 100, '--chart-5');
                drawRegister('Dest', cx + cardWidth/2 + 80, vizY + 50, '--chart-5');
                ctx.drawArrow(cx + cardWidth/2 - 50, vizY + 10, 80 + flowOffset, 30, '--chart-5');
                ctx.drawArrow(cx + cardWidth/2 - 50, vizY + 90, 80 + flowOffset, -30, '--chart-5');
                ctx.fillText('Original values preserved', cx + cardWidth/2 + 20, vizY + 85);
            } 
            else if (item.type === '2-to-N') {
                // Data Movement Visualization
                const isLDR = item.id.includes('MOV/LDR');
                drawRegister('Mem/Reg', cx - cardWidth/2 - 50, vizY + 50, '--primary');
                drawRegister('Reg', cx - cardWidth/2 + 50, vizY + 50, '--primary');
                ctx.drawArrow(cx - cardWidth/2 - 20, vizY + 50, 40, 0, '--primary');
                ctx.fillText('Unified MOV', cx - cardWidth/2, vizY + 85);

                drawRegister('Memory', cx + cardWidth/2 - 50, vizY + 10, '--chart-5');
                drawRegister('Register', cx + cardWidth/2 + 50, vizY + 10, '--chart-5');
                ctx.drawArrow(cx + cardWidth/2 - 20, vizY + 10, 40, 0, '--chart-2');
                ctx.fillText('LDR', cx + cardWidth/2, vizY + 35);

                drawRegister('Register', cx + cardWidth/2 - 50, vizY + 80, '--chart-5');
                drawRegister('Register', cx + cardWidth/2 + 50, vizY + 80, '--chart-5');
                ctx.drawArrow(cx + cardWidth/2 - 20, vizY + 80, 40, 0, '--chart-3');
                ctx.fillText('MOV', cx + cardWidth/2, vizY + 105);
            }
            else if (item.type === 'flow') {
                // Control Flow (Jumps)
                ctx.save();
                ctx.font = '40px "Google Symbols"';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = WH.getColor('--primary');
                ctx.fillText('arrow_forward', cx - cardWidth/2, vizY + 50);
                ctx.fillStyle = WH.getColor('--chart-5');
                ctx.fillText('alt_route', cx + cardWidth/2, vizY + 50);
                
                ctx.font = '14px "Google Sans"';
                ctx.fillStyle = WH.getColor('--on-surface-default');
                ctx.fillText(item.id.includes('CALL') ? 'Stack Based' : 'Direct Jump', cx - cardWidth/2, vizY + 90);
                ctx.fillText(item.id.includes('CALL') ? 'Link Register' : 'Branching', cx + cardWidth/2, vizY + 90);
                ctx.restore();
            }
        }
    };
});