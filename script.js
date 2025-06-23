//Use: "terser script.js -o script.min.js --compress --mangle" to compress the file (make the min file)
document.addEventListener("DOMContentLoaded", function (){
    let $sequenceInput=$("#sequence");
    let $conversionType=$("#conversionType");
    let $showBaseNames=$("#showBaseNames");
    let $colorizeSequence=$("#colorizeSequence");
    let $result=$("#result");
    let $error=$("#error");
    let $baseButtons=$("#base-buttons");
    let $deleteLast=$("#delete-last");
    let $clearAll=$("#clear-all");
    let $copyResults=$("#copy-results");
    let $resetAll=$("#reset-all");
    let $visualizerContainer=$("#visualizer-container");
    let $visualizerTitle=$("#visualizer-title");
    let $aminoAcidTooltip=$(".amino-acid-tooltip");
    let canvas=document.getElementById("sequence-visualizer");
    let ctx=canvas.getContext("2d");
    let dnaBases=["A", "T", "G", "C"];
    let rnaBases=["A", "U", "G", "C"];
    let sequenceOutputTypes=["DNA_COMPLEMENT", "RNA_COMPLEMENT", "DNA_TRANSCRIPT"];
    let codonTable={
        "UUU": "Phenylalanine", "UUC": "Phenylalanine", "UUA": "Leucine", "UUG": "Leucine",
        "CUU": "Leucine", "CUC": "Leucine", "CUA": "Leucine", "CUG": "Leucine",
        "AUU": "Isoleucine", "AUC": "Isoleucine", "AUA": "Isoleucine", "AUG": "Methionine",
        "GUU": "Valine", "GUC": "Valine", "GUA": "Valine", "GUG": "Valine",
        "UCU": "Serine", "UCC": "Serine", "UCA": "Serine", "UCG": "Serine",
        "CCU": "Proline", "CCC": "Proline", "CCA": "Proline", "CCG": "Proline",
        "ACU": "Threonine", "ACC": "Threonine", "ACA": "Threonine", "ACG": "Threonine",
        "GCU": "Alanine", "GCC": "Alanine", "GCA": "Alanine", "GCG": "Alanine",
        "UAU": "Tyrosine", "UAC": "Tyrosine", "UAA": "Stop", "UAG": "Stop",
        "CAU": "Histidine", "CAC": "Histidine", "CAA": "Glutamine", "CAG": "Glutamine",
        "AAU": "Asparagine", "AAC": "Asparagine", "AAA": "Lysine", "AAG": "Lysine",
        "GAU": "Aspartic Acid", "GAC": "Aspartic Acid", "GAA": "Glutamic Acid", "GAG": "Glutamic Acid",
        "UGU": "Cysteine", "UGC": "Cysteine", "UGA": "Stop", "UGG": "Tryptophan",
        "CGU": "Arginine", "CGC": "Arginine", "CGA": "Arginine", "CGG": "Arginine",
        "AGU": "Serine", "AGC": "Serine", "AGA": "Arginine", "AGG": "Arginine",
        "GGU": "Glycine", "GGC": "Glycine", "GGA": "Glycine", "GGG": "Glycine"
    };
    $sequenceInput.tooltip({
        content: "Enter DNA or RNA sequence (only A, T, G, C, U characters allowed)",
        position:{ my: "left+10 center", at: "right center" }
    });
    $sequenceInput.on("focus", function (){
        $(this).addClass("highlight-effect");
    }).on("blur", function (){
        $(this).removeClass("highlight-effect");
    });
    $sequenceInput.on("input", convertSequence);
    $conversionType.on("change", function (){
        updateBaseButtons();
        convertSequence();
    });
    $showBaseNames.on("change", convertSequence);
    $colorizeSequence.on("change", convertSequence);
    $deleteLast.on("click", deleteLastCharacter);
    $clearAll.on("click", clearSequence);
    $copyResults.on("click", copyResultsToClipboard);
    $resetAll.on("click", resetApplication);
    updateBaseButtons();
    updateButtonStates();
    function drawVisualization(sequence, conversionType){
        $visualizerContainer.hide();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let baseWidth=40;
        let baseHeight=20;
        let padding=20;
        let width=Math.min(sequence.length*baseWidth+2*padding, window.innerWidth-40);
        let height=conversionType.includes("PROTEIN")?150:180;
        let dpr=window.devicePixelRatio||1;
        canvas.style.width=width+"px";
        canvas.style.height=height+"px";
        canvas.width=width*dpr;
        canvas.height=height*dpr;
        ctx.scale(dpr, dpr);
        let rnaSequence;
        if (conversionType=="RNA_PROTEIN"){
            rnaSequence=sequence;
        }
        else if (conversionType=="DNA_PROTEIN"){
            rnaSequence=getRNATranscriptFromDNA(sequence);
        }
        else{
            rnaSequence=null;
        }
        if (conversionType.includes("PROTEIN")){
            drawPolypeptideChain(rnaSequence, width, height, padding);
        }
        else{
            drawAntiparallelStrands(sequence, conversionType, width, height, padding);
        }
        $visualizerContainer.show();
    }
    function drawAntiparallelStrands(sequence, conversionType, width, height, padding){
        let baseWidth=40;
        let baseHeight=20;
        let yCenter=height/2;
        $visualizerTitle.text("Antiparallel Strands Visualization");
        drawStrand(sequence, padding, yCenter-40, baseWidth, baseHeight, "top", conversionType);
        let complement="";
        if (conversionType=="DNA_COMPLEMENT"){
            complement=getDNAComplement(sequence);
        }
        else if (conversionType=="RNA_COMPLEMENT"){
            complement=getRNAComplement(sequence);
        }
        else if (conversionType=="DNA_TRANSCRIPT"){
            complement=getRNATranscriptFromDNA(sequence);
        }
        drawStrand(complement, padding, yCenter+40, baseWidth, baseHeight, "bottom", conversionType);
        for (let i=0;i<sequence.length;i++){
            let x=padding+i*baseWidth+baseWidth/2;
            ctx.beginPath();
            ctx.moveTo(x, yCenter-40+baseHeight);
            ctx.lineTo(x, yCenter+40);
            ctx.strokeStyle="#CED4DA";
            ctx.lineWidth=1;
            ctx.stroke();
        }
        ctx.fillStyle="#6C757D";
        ctx.font="12px Noto Sans";
        ctx.textAlign="center";
        ctx.textBaseline="middle";
    }
    function drawStrand(sequence, startX, startY, baseWidth, baseHeight, strandType, conversionType){
        let isTopStrand=strandType=="top";
        let direction=isTopStrand?1:-1;
        for (let i=0;i<sequence.length;i++){
            let x=startX+i*baseWidth;
            let y=startY;
            let base=sequence[i];
            ctx.fillStyle=getBaseColor(base, conversionType);
            ctx.fillRect(x, y, baseWidth, baseHeight);
            ctx.strokeStyle="#343A40";
            ctx.lineWidth=1;
            ctx.strokeRect(x, y, baseWidth, baseHeight);
            ctx.fillStyle="#FFFFFF";
            ctx.font="bold 14px Noto Sans";
            ctx.textAlign="center";
            ctx.textBaseline="middle";
            ctx.fillText(base, x+baseWidth/2, y+baseHeight/2);
            ctx.beginPath();
            ctx.moveTo(x, y+(isTopStrand?0:baseHeight));
            ctx.lineTo(x+baseWidth, y+(isTopStrand?0:baseHeight));
            ctx.strokeStyle="#495057";
            ctx.lineWidth=3;
            ctx.stroke();
        }
    }
    function drawPolypeptideChain(rnaSequence, width, height, padding){
        $visualizerTitle.text("Polypeptide Chain Visualization");
        let aminoAcidRadius=25;
        let spacing=60;
        let startX=padding+aminoAcidRadius;
        let startY=height/2;
        let aminoAcidColors={
            "Alanine": "#FF6B6B", "Arginine": "#4ECDC4", "Asparagine": "#1A936F",
            "Aspartic Acid": "#6A0572", "Cysteine": "#FFD166", "Glutamic Acid": "#118AB2",
            "Glutamine": "#073B4C", "Glycine": "#EF476F", "Histidine": "#FFD166",
            "Isoleucine": "#06D6A0", "Leucine": "#7209B7", "Lysine": "#3A86FF",
            "Methionine": "#FB5607", "Phenylalanine": "#8338EC", "Proline": "#3A86FF",
            "Serine": "#FF006E", "Threonine": "#FFBE0B", "Tryptophan": "#8AC926",
            "Tyrosine": "#FF9E00", "Valine": "#4361EE"
        };
        let codons=[];
        for (let i=0;i<rnaSequence.length;i+=3){
            let codon=rnaSequence.slice(i, i+3);
            if (codon.length==3){
                let aminoAcid=codonTable[codon]||"Unknown";
                if (aminoAcid=="Stop") break;
                codons.push({
                    codon: codon,
                    aminoAcid: aminoAcid,
                    color: aminoAcidColors[aminoAcid.split(" ")[0]]||"#6C757D",
                    x: startX+codons.length*spacing,
                    y: startY
                });
            }
        }
        ctx.beginPath();
        for (let i=0;i<codons.length-1;i++){
            let curr=codons[i];
            let next=codons[i+1];
            ctx.moveTo(curr.x+aminoAcidRadius, curr.y);
            ctx.lineTo(next.x-aminoAcidRadius, next.y);
        }
        ctx.strokeStyle="#495057";
        ctx.lineWidth=2;
        ctx.stroke();
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseout", handleMouseOut);
        function handleMouseMove(e){
            let rect=canvas.getBoundingClientRect();
            let mouseX=e.clientX-rect.left;
            let mouseY=e.clientY-rect.top;
            let tooltipShown=false;
            for (let codon of codons){
                let distance=Math.sqrt((mouseX-codon.x)**2+(mouseY-codon.y)**2);
                if (distance<aminoAcidRadius){
                    $aminoAcidTooltip
                        .text(codon.aminoAcid+" ("+codon.codon+")")
                        .css({
                            left: e.pageX+10,
                            top: e.pageY-30,
                            display: "block"
                        });
                    tooltipShown=true;
                    break;
                }
            }
            if (!tooltipShown) $aminoAcidTooltip.hide();
        }
        function handleMouseOut(){
            $aminoAcidTooltip.hide();
        }
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseout", handleMouseOut);
        for (let codon of codons){
            let{ x, y, color, aminoAcid }=codon;
            ctx.beginPath();
            ctx.arc(x, y, aminoAcidRadius, 0, Math.PI*2);
            ctx.fillStyle=color;
            ctx.fill();
            ctx.strokeStyle="#343A40";
            ctx.lineWidth=1;
            ctx.stroke();
            let abbr=aminoAcid.substring(0, 3);
            ctx.fillStyle="#FFFFFF";
            ctx.font="bold 12px Noto Sans";
            ctx.textAlign="center";
            ctx.textBaseline="middle";
            ctx.fillText(abbr, x, y);
        }
    }
    function getBaseColor(base, conversionType){
        let colors={
            "A": "#FF6B6B",
            "T": "#4ECDC4",
            "U": "#1A936F",
            "G": "#FFD166",
            "C": "#6A0572"
        };
        return colors[base]||"#6C757D";
    }
    function convertSequence(){
        clearError();
        let sequence=$sequenceInput.val().trim().toUpperCase();
        let conversionType=$conversionType.val();
        let showBaseNames=$showBaseNames.is(":checked");
        let colorize=$colorizeSequence.is(":checked");
        if (!validateSequence(sequence, conversionType)){
            return;
        }
        if (sequence){
            drawVisualization(sequence, conversionType);
        }
        else{
            $visualizerContainer.hide();
        }
        if (sequenceOutputTypes.includes(conversionType)){
            updateSequenceConversion(sequence, conversionType, showBaseNames, colorize);
        }
        else{
            updateProteinConversion(sequence, conversionType, showBaseNames, colorize);
        }
        updateButtonStates();
    }
    function validateSequence(sequence, conversionType){
        clearError();
        let validDNA=/^[ATGC]*$/i;
        let validRNA=/^[AUGC]*$/i;
        let isValid=true;
        let errorMessage="";
        if (sequence==""){
            $result.html("");
            return true;
        }
        if (conversionType=="RNA_PROTEIN"||conversionType=="RNA_COMPLEMENT"){
            if (!validRNA.test(sequence)){
                isValid=false;
                errorMessage="Invalid RNA sequence. Only A, U, G, C characters are allowed.";
            }
        }
        else{
            if (!validDNA.test(sequence)){
                isValid=false;
                errorMessage="Invalid DNA sequence. Only A, T, G, C characters are allowed.";
            }
        }
        if (!isValid){
            showError(errorMessage);
            return false;
        }
        return true;
    }
    function showError(message){
        $error.text(message).fadeIn(200).addClass("error-shake");
        setTimeout(function (){
            $error.removeClass("error-shake");
        }, 500);
        $result.hide();
    }
    function clearError(){
        $error.hide().text("");
        $result.show();
    }
    function updateSequenceConversion(sequence, conversionType, showBaseNames, colorize){
        let outputSequence=getOutputSequence(sequence, conversionType);
        let html="<p><strong>"+getLabel(conversionType)+":</strong> ";
        if (colorize){
            html+="<span class=\"sequence-container\">";
            for (let i=0;i<outputSequence.length;i++){
                let base=outputSequence[i];
                html+="<span class=\"base-"+base.toLowerCase()+"\">"+base+"</span>";
            }
            html+="</span>";
        }
        else{
            html+=outputSequence;
        }
        html+="</p>";
        if (showBaseNames){
            html+="<p><strong>Input Bases:</strong> "+getBaseNames(sequence)+"</p>";
            html+="<p><strong>Output Bases:</strong> "+getBaseNames(outputSequence)+"</p>";
        }
        $result.html(html);
    }
    function updateProteinConversion(sequence, conversionType, showBaseNames, colorize){
        let html="";
        let codons, incomplete;
        if (conversionType=="RNA_PROTEIN"){
            let result=decodeRNAtoProtein(sequence);
            codons=result.codons;
            incomplete=result.incomplete;
        }
        else{
            let rnaTranscript=getRNATranscriptFromDNA(sequence);
            let result=decodeRNAtoProtein(rnaTranscript);
            codons=result.codons;
            incomplete=result.incomplete;
        }
        if (codons.length>0){
            html="<table><tr><th>Codon</th><th>tRNA Anticodon</th><th>Amino Acid</th></tr>";
            for (let i=0;i<codons.length;i++){
                let codonObj=codons[i];
                let codon=codonObj.codon;
                let anticodon=codonObj.anticodon;
                let aminoAcid=codonObj.aminoAcid;
                let codonDisplay=codon;
                let anticodonDisplay=anticodon;
                if (colorize){
                    codonDisplay=colorizeSequence(codon);
                    anticodonDisplay=colorizeSequence(anticodon);
                }
                html+="<tr><td>"+codonDisplay+"</td><td>"+anticodonDisplay+"</td><td><strong>"+aminoAcid+"</strong></td></tr>";
            }
            html+="</table>";
            if (incomplete){
                html+="<p><strong>Incomplete codon:</strong> "+incomplete+"</p>";
            }
            if (showBaseNames){
                html+="<p><strong>Input Bases:</strong> "+getBaseNames(sequence)+"</p>";
            }
            $result.html(html);
        }
        else{
            showError("No complete codons found.");
        }
    }
    function colorizeSequence(sequence){
        let colored="";
        for (let i=0;i<sequence.length;i++){
            let base=sequence[i];
            colored+="<span class=\"base-"+base.toLowerCase()+"\">"+base+"</span>";
        }
        return colored;
    }
    function getOutputSequence(sequence, conversionType){
        if (conversionType=="DNA_COMPLEMENT"){
            return getDNAComplement(sequence);
        }
        if (conversionType=="RNA_COMPLEMENT"){
            return getRNAComplement(sequence);
        }
        if (conversionType=="DNA_TRANSCRIPT"){
            return getRNATranscriptFromDNA(sequence);
        }
        return "";
    }
    function getDNAComplement(dnaSequence){
        let complementMap={ A: "T", T: "A", C: "G", G: "C" };
        let complement="";
        for (let i=0;i<dnaSequence.length;i++){
            let base=dnaSequence[i];
            complement+=complementMap[base]||base;
        }
        return complement;
    }
    function getRNAComplement(rnaSequence){
        let complementMap={ A: "U", U: "A", C: "G", G: "C" };
        let complement="";
        for (let i=0;i<rnaSequence.length;i++){
            let base=rnaSequence[i];
            complement+=complementMap[base]||base;
        }
        return complement;
    }
    function getRNATranscriptFromDNA(dnaSequence){
        let transcriptMap={ A: "U", T: "A", C: "G", G: "C" };
        let transcript="";
        for (let i=0;i<dnaSequence.length;i++){
            let base=dnaSequence[i];
            transcript+=transcriptMap[base]||base;
        }
        return transcript;
    }
    function getAnticodon(codon){
        let complementMap={ "A": "U", "U": "A", "G": "C", "C": "G" };
        let anticodon="";
        for (let i=codon.length-1;i>=0;i--){
            let base=codon[i];
            anticodon+=complementMap[base]||base;
        }
        return anticodon;
    }
    function decodeRNAtoProtein(rnaSequence){
        let codons=[];
        for (let i=0;i<rnaSequence.length;i+=3){
            let codon=rnaSequence.slice(i, i+3);
            if (codon.length==3){
                let anticodon=getAnticodon(codon);
                let aminoAcid=codonTable[codon]||"Unknown";
                codons.push({ codon: codon, anticodon: anticodon, aminoAcid: aminoAcid });
            }
            else{
                return{ codons: codons, incomplete: codon };
            }
        }
        return{ codons: codons, incomplete: null };
    }
    function getLabel(conversionType){
        let labels={
            "DNA_COMPLEMENT": "Complement DNA",
            "RNA_COMPLEMENT": "Complement RNA",
            "DNA_TRANSCRIPT": "RNA Transcript"
        };
        return labels[conversionType]||"";
    }
    function getBaseName(base){
        let baseNames={
            A: "Adenine",
            T: "Thymine",
            U: "Uracil",
            C: "Cytosine",
            G: "Guanine"
        };
        return baseNames[base]||base;
    }
    function getBaseNames(sequence){
        let names="";
        for (let i=0;i<sequence.length;i++){
            let base=sequence[i];
            names+=getBaseName(base);
            if (i<sequence.length-1){
                names+=", ";
            }
        }
        return names;
    }
    function updateBaseButtons(){
        let conversionType=$conversionType.val();
        let bases=(["DNA_COMPLEMENT", "DNA_TRANSCRIPT", "DNA_PROTEIN"].includes(conversionType))?dnaBases:rnaBases;
        $baseButtons.empty();
        for (let i=0;i<bases.length;i++){
            let base=bases[i];
            let $button=$("<button class=\"base-btn\">"+base+"</button>");
            $button.on("click", function (){
                let currentBase=this.textContent;
                $sequenceInput.val($sequenceInput.val()+currentBase);
                convertSequence();
            });
            $baseButtons.append($button);
        }
    }
    function updateButtonStates(){
        let sequence=$sequenceInput.val();
        let disabled=sequence.length==0;
        $deleteLast.prop("disabled", disabled);
        $clearAll.prop("disabled", disabled);
    }
    function deleteLastCharacter(){
        let currentSequence=$sequenceInput.val();
        if (currentSequence.length>0){
            $sequenceInput.val(currentSequence.slice(0, -1));
            convertSequence();
        }
    }
    function clearSequence(){
        $sequenceInput.val("");
        convertSequence();
        $sequenceInput.focus();
    }
    function copyResultsToClipboard(){
        let text=$result.text();
        if (text){
            navigator.clipboard.writeText(text).then(function (){
                alert("Results copied to clipboard!");
            }).catch(function (err){
                showError("Failed to copy results.");
                console.error("Copy failed:", err);
            });
        }
        else{
            showError("No results to copy.");
        }
    }
    function resetApplication(){
        $sequenceInput.val("");
        $conversionType.val("DNA_COMPLEMENT");
        $showBaseNames.prop("checked", true);
        $colorizeSequence.prop("checked", true);
        $result.html("");
        $visualizerContainer.hide();
        clearError();
        updateBaseButtons();
        updateButtonStates();
        $sequenceInput.focus();
    }
});
// Only used for electron app building, uncomment it if you need it
// document.addEventListener("DOMContentLoaded", function(){
//     let minimizeButton=document.getElementById("minimize-button");
//     let maximizeButton=document.getElementById("maximize-button");
//     let closeButton=document.getElementById("close-button");
//     minimizeButton.addEventListener("click", function(){
//         window.electronAPI.minimizeWindow();
//     });
//     maximizeButton.addEventListener("click", function(){
//         window.electronAPI.toggleMaximizeWindow();
//     });
//     closeButton.addEventListener("click", function(){
//         window.electronAPI.closeWindow();
//     });
//     function updateMaximizeButton(){
//         if (maximizeButton.classList.contains("maximized")){
//             maximizeButton.classList.add("maximized");
//         }
//         else{
//             maximizeButton.classList.remove("maximized");
//         }
//     }
//     window.electronAPI.onMaximize(function(){
//         maximizeButton.classList.add("maximized");
//     });
//     window.electronAPI.onUnmaximize(function(){
//         maximizeButton.classList.remove("maximized");
//     });
//     updateMaximizeButton();
// });