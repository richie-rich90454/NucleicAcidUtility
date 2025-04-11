document.addEventListener("DOMContentLoaded", function(){
    let sequenceInput=document.getElementById("sequence");
    let conversionTypeSelect=document.getElementById("conversionType");
    let showBaseNamesCheckbox=document.getElementById("showBaseNames");
    let resultDiv=document.getElementById("result");
    let errorDiv=document.getElementById("error");
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
    sequenceInput.addEventListener("input", convertSequence);
    conversionTypeSelect.addEventListener("input", convertSequence);
    showBaseNamesCheckbox.addEventListener("input", convertSequence);
    function convertSequence(){
        let sequence=sequenceInput.value.trim().toUpperCase();
        let conversionType=conversionTypeSelect.value;
        errorDiv.textContent="";
        resultDiv.innerHTML="";
        if (!sequence){
            errorDiv.textContent="Please enter a sequence.";
            return;
        }
        let regex;
        if (conversionType=="DNA_COMPLEMENT"||conversionType=="DNA_TRANSCRIPT"||conversionType=="DNA_PROTEIN"){
            regex=/^[ATCG]+$/;
            if (!regex.test(sequence)){
                errorDiv.textContent="Invalid DNA sequence. Use only A, T, C, G.";
                return;
            }
        }
        else if (conversionType=="RNA_COMPLEMENT"||conversionType=="RNA_PROTEIN"){
            regex=/^[AUCG]+$/;
            if (!regex.test(sequence)){
                errorDiv.textContent="Invalid RNA sequence. Use only A, U, C, G.";
                return;
            }
        }
        if (conversionType=="DNA_COMPLEMENT"){
            let outputSequence=getDNAComplement(sequence);
            resultDiv.textContent=`Complement DNA: ${outputSequence}`;
            if (showBaseNamesCheckbox.checked){
                resultDiv.innerHTML+=`<br><strong>Input Bases:</strong> ${getBaseNames(sequence)}`;
                resultDiv.innerHTML+=`<br><strong>Output Bases:</strong> ${getBaseNames(outputSequence)}`;
            }
        }
        else if (conversionType=="DNA_TRANSCRIPT"){
            let rnaTranscript=getRNATranscriptFromDNA(sequence);
            resultDiv.textContent=`RNA Transcript: ${rnaTranscript}`;
            if (showBaseNamesCheckbox.checked){
                resultDiv.innerHTML+=`<br><strong>Input Bases:</strong> ${getBaseNames(sequence)}`;
                resultDiv.innerHTML+=`<br><strong>Output Bases:</strong> ${getBaseNames(rnaTranscript)}`;
            }
        }
        else if (conversionType=="RNA_COMPLEMENT"){
            let outputSequence=getRNAComplement(sequence);
            resultDiv.textContent=`Complement RNA: ${outputSequence}`;
            if (showBaseNamesCheckbox.checked){
                resultDiv.innerHTML+=`<br><strong>Input Bases:</strong> ${getBaseNames(sequence)}`;
                resultDiv.innerHTML+=`<br><strong>Output Bases:</strong> ${getBaseNames(outputSequence)}`;
            }
        }
        else if (conversionType=="RNA_PROTEIN"){
            let { codons, incomplete }=decodeRNAtoProtein(sequence);
            if (codons.length>0){
                let table="<table><tr><th>Codon</th><th>tRNA Anticodon</th><th>Amino Acid</th></tr>";
                codons.forEach(({ codon, anticodon, aminoAcid })=>{
                    table+=`<tr><td>${codon}</td><td>${anticodon}</td><td>${aminoAcid}</td></tr>`;
                });
                table+="</table>";
                resultDiv.innerHTML=table;
                if (incomplete){
                    resultDiv.innerHTML+=`<p>Incomplete codon: ${incomplete}</p>`;
                }
                if (showBaseNamesCheckbox.checked){
                    resultDiv.innerHTML+=`<br><strong>Input Bases:</strong> ${getBaseNames(sequence)}`;
                }
            }
            else{
                errorDiv.textContent="No complete codons found.";
            }
        }
        else if (conversionType=="DNA_PROTEIN"){
            let rnaTranscript=getRNATranscriptFromDNA(sequence);
            let{ codons, incomplete }=decodeRNAtoProtein(rnaTranscript);
            if (codons.length>0){
                let table="<table><tr><th>Codon</th><th>tRNA Anticodon</th><th>Amino Acid</th></tr>";
                codons.forEach(({ codon, anticodon, aminoAcid })=>{
                    table+=`<tr><td>${codon}</td><td>${anticodon}</td><td>${aminoAcid}</td></tr>`;
                });
                table+="</table>";
                resultDiv.innerHTML=table;
                if (incomplete){
                    resultDiv.innerHTML+=`<p>Incomplete codon: ${incomplete}</p>`;
                }
                if (showBaseNamesCheckbox.checked){
                    resultDiv.innerHTML+=`<br><strong>Input Bases:</strong> ${getBaseNames(sequence)}`;
                }
            }
            else{
                errorDiv.textContent="No complete codons found.";
            }
        }
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