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
    function convertSequence(){
        clearError();
        let sequence=$sequenceInput.val().trim().toUpperCase();
        let conversionType=$conversionType.val();
        let showBaseNames=$showBaseNames.is(":checked");
        let colorize=$colorizeSequence.is(":checked");
        if (!validateSequence(sequence, conversionType)){
            return;
        }
        if (sequenceOutputTypes.includes(conversionType)){
            updateSequenceConversion(sequence, conversionType, showBaseNames, colorize);
        }
        else{
            updateProteinConversion(sequence, conversionType, showBaseNames, colorize);
        }
        previousSequence=sequence;
        previousConversionType=conversionType;
        previousShowBaseNames=showBaseNames;
        previousColorize=colorize;
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
        setTimeout(()=>$error.removeClass("error-shake"), 500);
        $result.hide();
    }
    function clearError(){
        $error.hide().text("");
        $result.show();
    }
    function updateSequenceConversion(sequence, conversionType, showBaseNames, colorize){
        let outputSequence=getOutputSequence(sequence, conversionType);
        let html=`<p><strong>${getLabel(conversionType)}:</strong> `;
        if (colorize){
            html+=`<span class="sequence-container">`;
            for (let i=0;i<outputSequence.length;i++){
                let base=outputSequence[i];
                html+=`<span class="base-${base.toLowerCase()}">${base}</span>`;
            }
            html+=`</span>`;
        }
        else{
            html+=outputSequence;
        }
        html+=`</p>`;
        if (showBaseNames){
            html+=`<p><strong>Input Bases:</strong> ${getBaseNames(sequence)}</p>`;
            html+=`<p><strong>Output Bases:</strong> ${getBaseNames(outputSequence)}</p>`;
        }
        
        $result.html(html);
    }
    function updateProteinConversion(sequence, conversionType, showBaseNames, colorize){
        let html="";
        let codons, incomplete;
        if (conversionType=="RNA_PROTEIN"){
            ({ codons, incomplete }=decodeRNAtoProtein(sequence));
        }
        else{
            let rnaTranscript=getRNATranscriptFromDNA(sequence);
            ({ codons, incomplete }=decodeRNAtoProtein(rnaTranscript));
        }
        if (codons.length > 0){
            html="<table><tr><th>Codon</th><th>tRNA Anticodon</th><th>Amino Acid</th></tr>";
            codons.forEach(({ codon, anticodon, aminoAcid })=>{
                let codonDisplay=codon;
                let anticodonDisplay=anticodon;
                if (colorize){
                    codonDisplay=colorizeSequence(codon);
                    anticodonDisplay=colorizeSequence(anticodon);
                }
                html+=`<tr><td>${codonDisplay}</td><td>${anticodonDisplay}</td><td><strong>${aminoAcid}</strong></td></tr>`;
            });
            html+="</table>";
            if (incomplete){
                html+=`<p><strong>Incomplete codon:</strong> ${incomplete}</p>`;
            }
            if (showBaseNames){
                html+=`<p><strong>Input Bases:</strong> ${getBaseNames(sequence)}</p>`;
            }
            $result.html(html);
        }
        else{
            showError("No complete codons found.");
        }
    }
    function colorizeSequence(sequence){
        return [...sequence].map(base=>
            `<span class="base-${base.toLowerCase()}">${base}</span>`
        ).join("");
    }
    function getOutputSequence(sequence, conversionType){
        if (conversionType=="DNA_COMPLEMENT") return getDNAComplement(sequence);
        if (conversionType=="RNA_COMPLEMENT") return getRNAComplement(sequence);
        if (conversionType=="DNA_TRANSCRIPT") return getRNATranscriptFromDNA(sequence);
        return "";
    }
    function getDNAComplement(dnaSequence){
        let complementMap={ A: "T", T: "A", C: "G", G: "C" };
        return [...dnaSequence].map(base=>complementMap[base]||base).join("");
    }
    function getRNAComplement(rnaSequence){
        let complementMap={ A: "U", U: "A", C: "G", G: "C" };
        return [...rnaSequence].map(base=>complementMap[base]||base).join("");
    }
    function getRNATranscriptFromDNA(dnaSequence){
        let transcriptMap={ A: "U", T: "A", C: "G", G: "C" };
        return [...dnaSequence].map(base=>transcriptMap[base]||base).join("");
    }
    function getAnticodon(codon){
        let complementMap={ "A": "U", "U": "A", "G": "C", "C": "G" };
        return [...codon].map(base=>complementMap[base]||base).reverse().join("");
    }
    function decodeRNAtoProtein(rnaSequence){
        let codons=[];
        for (let i=0;i<rnaSequence.length;i+=3){
            let codon=rnaSequence.slice(i, i+3);
            if (codon.length==3){
                let anticodon=getAnticodon(codon);
                let aminoAcid=codonTable[codon]||"Unknown";
                codons.push({ codon, anticodon, aminoAcid });
            }
            else{
                return { codons, incomplete: codon };
            }
        }
        return { codons, incomplete: null };
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
        return [...sequence].map(base=>getBaseName(base)).join(", ");
    }
    function updateBaseButtons(){
        let conversionType=$conversionType.val();
        let bases=(["DNA_COMPLEMENT", "DNA_TRANSCRIPT", "DNA_PROTEIN"].includes(conversionType))?dnaBases:rnaBases;
        $baseButtons.empty();
        bases.forEach(base=>{
            let $button=$(`<button class="base-btn">${base}</button>`);
            $button.on("click", ()=>{
                $sequenceInput.val($sequenceInput.val()+base);
                convertSequence();
            });
            $baseButtons.append($button);
        });
    }
    function updateButtonStates(){
        let sequence=$sequenceInput.val();
        let disabled=sequence.length==0;
        $deleteLast.prop("disabled", disabled);
        $clearAll.prop("disabled", disabled);
    }
    function deleteLastCharacter(){
        $sequenceInput.val($sequenceInput.val().slice(0, -1));
        convertSequence();
    }
    function clearSequence(){
        $sequenceInput.val("");
        convertSequence();
        $sequenceInput.focus();
    }
    function copyResultsToClipboard(){
        let text=$result.text();
        if (text){
            navigator.clipboard.writeText(text).then(()=>{alert("Results copied to clipboard!");}).catch(err=>{showError("Failed to copy results");console.error("Copy failed:", err);});
        }
    }
    function resetApplication(){
        $sequenceInput.val("");
        $conversionType.val("DNA_COMPLEMENT");
        $showBaseNames.prop("checked", true);
        $colorizeSequence.prop("checked", true);
        $result.html("");
        clearError();
        updateBaseButtons();
        updateButtonStates();
        $sequenceInput.focus();
    }
});