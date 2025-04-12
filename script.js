document.addEventListener("DOMContentLoaded", function(){
    let $sequenceInput=$("#sequence");
    let $conversionType=$("#conversionType");
    let $showBaseNames=$("#showBaseNames");
    let $result=$("#result");
    let $error=$("#error");
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
        content: "Enter DNA or RNA sequence",
        position:{ my: "left+10 center", at: "right center" }
    });
    $sequenceInput.on("focus", function(){
        $(this).addClass("highlight-effect");
    }).on("blur", function(){
        $(this).removeClass("highlight-effect");
    });
    $sequenceInput.on("input", convertSequence);
    $conversionType.on("selectmenuchange", convertSequence);
    $showBaseNames.on("change", convertSequence);
    function convertSequence(){
        $.when(
            $result.stop(true, false).fadeOut(200),
            $error.stop(true, false).fadeOut(200)
        ).then(function(){
            $error.text("");
            $result.html("");
            let sequence=$sequenceInput.val().trim().toUpperCase();
            let conversionType=$conversionType.val();
            if (!sequence){
                $error.text("Please enter a sequence.");
                $error.fadeIn(200);
                return;
            }
            let regex;
            if (conversionType=="DNA_COMPLEMENT"||conversionType=="DNA_TRANSCRIPT"||conversionType=="DNA_PROTEIN"){
                regex=/^[ATCG]+$/;
                if (!regex.test(sequence)){
                    $error.text("Invalid DNA sequence. Use only A, T, C, G.");
                    $error.fadeIn(200);
                    return;
                }
            }
            else if (conversionType=="RNA_COMPLEMENT"||conversionType=="RNA_PROTEIN"){
                regex=/^[AUCG]+$/;
                if (!regex.test(sequence)){
                    $error.text("Invalid RNA sequence. Use only A, U, C, G.");
                    $error.fadeIn(200);
                    return;
                }
            }
            if (conversionType=="DNA_COMPLEMENT"){
                let outputSequence=getDNAComplement(sequence);
                let html=`<p>Complement DNA: ${outputSequence}</p>`;
                if ($showBaseNames.is(":checked")){
                    html+=`<p><strong>Input Bases:</strong> ${getBaseNames(sequence)}</p>`;
                    html+=`<p><strong>Output Bases:</strong> ${getBaseNames(outputSequence)}</p>`;
                }
                $result.html(html);
                $result.fadeIn(200);
            }
            else if (conversionType=="DNA_TRANSCRIPT"){
                let rnaTranscript=getRNATranscriptFromDNA(sequence);
                let html=`<p>RNA Transcript: ${rnaTranscript}</p>`;
                if ($showBaseNames.is(":checked")){
                    html+=`<p><strong>Input Bases:</strong> ${getBaseNames(sequence)}</p>`;
                    html+=`<p><strong>Output Bases:</strong> ${getBaseNames(rnaTranscript)}</p>`;
                }
                $result.html(html);
                $result.fadeIn(200);
            }
            else if (conversionType=="RNA_COMPLEMENT"){
                let outputSequence=getRNAComplement(sequence);
                let html=`<p>Complement RNA: ${outputSequence}</p>`;
                if ($showBaseNames.is(":checked")){
                    html+=`<p><strong>Input Bases:</strong> ${getBaseNames(sequence)}</p>`;
                    html+=`<p><strong>Output Bases:</strong> ${getBaseNames(outputSequence)}</p>`;
                }
                $result.html(html);
                $result.fadeIn(200);
            }
            else if (conversionType=="RNA_PROTEIN"){
                let{ codons, incomplete }=decodeRNAtoProtein(sequence);
                if (codons.length > 0){
                    let html="<table><tr><th>Codon</th><th>tRNA Anticodon</th><th>Amino Acid</th></tr>";
                    codons.forEach(({ codon, anticodon, aminoAcid })=>{
                        html+=`<tr><td>${codon}</td><td>${anticodon}</td><td>${aminoAcid}</td></tr>`;
                    });
                    html+="</table>";
                    if (incomplete){
                        html+=`<p>Incomplete codon: ${incomplete}</p>`;
                    }
                    if ($showBaseNames.is(":checked")){
                        html+=`<p><strong>Input Bases:</strong> ${getBaseNames(sequence)}</p>`;
                    }
                    $result.html(html);
                    $result.fadeIn(200);
                }
                else{
                    $error.text("No complete codons found.");
                    $error.fadeIn(200);
                }
            }
            else if (conversionType=="DNA_PROTEIN"){
                let rnaTranscript=getRNATranscriptFromDNA(sequence);
                let{ codons, incomplete }=decodeRNAtoProtein(rnaTranscript);
                if (codons.length > 0){
                    let html="<table><tr><th>Codon</th><th>tRNA Anticodon</th><th>Amino Acid</th></tr>";
                    codons.forEach(({ codon, anticodon, aminoAcid })=>{
                        html+=`<tr><td>${codon}</td><td>${anticodon}</td><td>${aminoAcid}</td></tr>`;
                    });
                    html+="</table>";
                    if (incomplete){
                        html+=`<p>Incomplete codon: ${incomplete}</p>`;
                    }
                    if ($showBaseNames.is(":checked")){
                        html+=`<p><strong>Input Bases:</strong> ${getBaseNames(sequence)}</p>`;
                    }
                    $result.html(html);
                    $result.fadeIn(200);
                }
                else{
                    $error.text("No complete codons found.");
                    $error.fadeIn(200);
                }
            }
        });
    }
    function getDNAComplement(dnaSequence){
        let complementMap={ "A": "T", "T": "A", "C": "G", "G": "C" };
        return [...dnaSequence].map(base=> complementMap[base]).join("");
    }
    function getRNAComplement(rnaSequence){
        let complementMap={ "A": "U", "U": "A", "C": "G", "G": "C" };
        return [...rnaSequence].map(base=> complementMap[base]).join("");
    }
    function getRNATranscriptFromDNA(dnaSequence){
        return dnaSequence.replace(/T/g, "U");
    }
    function getRNAReverseComplement(rnaSequence){
        let complement=getRNAComplement(rnaSequence);
        return complement.split("").reverse().join("");
    }
    function decodeRNAtoProtein(rnaSequence){
        let codons=[];
        for (let i=0; i<rnaSequence.length; i+=3){
            let codon=rnaSequence.slice(i, i+3);
            if (codon.length==3){
                let anticodon=getRNAReverseComplement(codon);
                let aminoAcid=codonTable[codon]||"Unknown";
                codons.push({ codon, anticodon, aminoAcid });
            }
            else{
                return{ codons, incomplete: codon };
            }
        }
        return{ codons, incomplete: null };
    }
    function getBaseNames(sequence){
        let baseNames={
            "A": "Adenine",
            "T": "Thymine",
            "U": "Uracil",
            "C": "Cytosine",
            "G": "Guanine"
        };
        return [...sequence].map(base=> baseNames[base]).join(", ");
    }
});