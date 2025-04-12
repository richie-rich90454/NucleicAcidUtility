document.addEventListener("DOMContentLoaded", function(){
    let $sequenceInput=$("#sequence");
    let $conversionType=$("#conversionType");
    let $showBaseNames=$("#showBaseNames");
    let $result=$("#result");
    let $error=$("#error");
    let previousSequence="";
    let previousConversionType="";
    let previousShowBaseNames=false;
    const sequenceOutputTypes=["DNA_COMPLEMENT", "RNA_COMPLEMENT", "DNA_TRANSCRIPT"];
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
    $conversionType.on("change", convertSequence);
    $showBaseNames.on("click", convertSequence);
    function convertSequence(){
        $.when(
            $error.stop(true, false).fadeOut(200)
        ).then(function(){
            $error.text("");
            let sequence=$sequenceInput.val().trim().toUpperCase();
            let conversionType=$conversionType.val();
            let showBaseNames=$showBaseNames.is(":checked");
            if (conversionType!==previousConversionType||showBaseNames!==previousShowBaseNames||!previousSequence){
                fullUpdate(sequence, conversionType, showBaseNames);
            }
            else if (sequenceOutputTypes.includes(conversionType)){
                differentialUpdate(sequence, conversionType, showBaseNames);
            }
            else{
                fullUpdate(sequence, conversionType, showBaseNames);
            }
            previousSequence=sequence;
            previousConversionType=conversionType;
            previousShowBaseNames=showBaseNames;
        });
    }
    function fullUpdate(sequence, conversionType, showBaseNames){
        if (sequenceOutputTypes.includes(conversionType)){
            let outputSequence=getOutputSequence(sequence, conversionType);
            let html=`<p>${getLabel(conversionType)}: <span class="sequence-container"></span></p>`;
            $result.html(html);
            let $sequenceContainer=$result.find('.sequence-container');
            for (let i=0; i<outputSequence.length; i++){
                let $span=$(`<span data-index="${i}">${outputSequence[i]}</span>`);
                $sequenceContainer.append($span);
                $span.hide().fadeIn(200);
            }
            if (showBaseNames){
                $result.append(`<p class="input-bases"><strong>Input Bases:</strong> ${getBaseNames(sequence)}</p>`);
                $result.append(`<p class="output-bases"><strong>Output Bases:</strong> ${getBaseNames(outputSequence)}</p>`);
            }
            else{
                $result.find('.input-bases, .output-bases').remove();
            }
        }
        else{
            $result.fadeOut(200, function(){
                let html="";
                let codons, incomplete;
                if (conversionType=="RNA_PROTEIN"){
                    ({ codons, incomplete }=decodeRNAtoProtein(sequence));
                }
                else{
                    let rnaTranscript=getRNATranscriptFromDNA(sequence);
                    ({codons, incomplete}=decodeRNAtoProtein(rnaTranscript));
                }
                if (codons.length>0){
                    html="<table><tr><th>Codon</th><th>tRNA Anticodon</th><th>Amino Acid</th></tr>";
                    codons.forEach(({ codon, anticodon, aminoAcid })=>{
                        html+=`<tr><td>${codon}</td><td>${anticodon}</td><td>${aminoAcid}</td></tr>`;
                    });
                    html+="</table>";
                    if (incomplete){
                        html+=`<p>Incomplete codon: ${incomplete}</p>`;
                    }
                    if (showBaseNames){
                        html+=`<p class="input-bases"><strong>Input Bases:</strong> ${getBaseNames(sequence)}</p>`;
                    }
                    $result.html(html);
                    $result.fadeIn(200);
                }
                else{
                    $error.text("No complete codons found.");
                    $error.fadeIn(200);
                }
            });
        }
    }
    function differentialUpdate(sequence, conversionType, showBaseNames){
        let outputSequence=getOutputSequence(sequence, conversionType);
        let $sequenceContainer=$result.find('.sequence-container');

        if ($sequenceContainer.length==0){
            fullUpdate(sequence, conversionType, showBaseNames);
            return;
        }

        let $currentSpans=$sequenceContainer.children('span');
        let maxIndex=Math.max(previousSequence.length, sequence.length);

        for (let i=0; i<maxIndex; i++){
            if (i<sequence.length){
                let base=outputSequence[i];
                let $span=$sequenceContainer.find(`span[data-index="${i}"]`);
                if ($span.length){
                    if ($span.text()!==base){
                        $span.fadeOut(100, function(){
                            $span.text(base);
                            $span.fadeIn(100);
                        });
                    }
                }
                else{
                    let $newSpan=$(`<span data-index="${i}">${base}</span>`);
                    if (i==0){
                        $sequenceContainer.prepend($newSpan);
                    }
                    else{
                        let $prevSpan=$sequenceContainer.find(`span[data-index="${i-1}"]`);
                        $prevSpan.length ? $prevSpan.after($newSpan) : $sequenceContainer.append($newSpan);
                    }
                    $newSpan.hide().fadeIn(200);
                }
            }
            else{
                let $span=$sequenceContainer.find(`span[data-index="${i}"]`);
                if ($span.length){
                    $span.fadeOut(200, function(){
                        $span.remove();
                    });
                }
            }
        }
        if (showBaseNames){
            let $inputBases=$result.find('.input-bases');
            let $outputBases=$result.find('.output-bases');
            if ($inputBases.length){
                $inputBases.html(`<strong>Input Bases:</strong> ${getBaseNames(sequence)}`);
            }
            else{
                $result.append(`<p class="input-bases"><strong>Input Bases:</strong> ${getBaseNames(sequence)}</p>`);
            }
            if ($outputBases.length){
                $outputBases.html(`<strong>Output Bases:</strong> ${getBaseNames(outputSequence)}`);
            }
            else{
                $result.append(`<p class="output-bases"><strong>Output Bases:</strong> ${getBaseNames(outputSequence)}</p>`);
            }
        }
        else{
            $result.find('.input-bases, .output-bases').remove();
        }
    }
    function getOutputSequence(sequence, conversionType){
        if (conversionType=="DNA_COMPLEMENT") return getDNAComplement(sequence);
        if (conversionType=="RNA_COMPLEMENT") return getRNAComplement(sequence);
        if (conversionType=="DNA_TRANSCRIPT") return getRNATranscriptFromDNA(sequence);
        return "";
    }
    function getLabel(conversionType){
        const labels={
            "DNA_COMPLEMENT": "Complement DNA",
            "RNA_COMPLEMENT": "Complement RNA",
            "DNA_TRANSCRIPT": "RNA Transcript"
        };
        return labels[conversionType]||"";
    }
    function getDNAComplement(dnaSequence){
        let complementMap={ "A": "T", "T": "A", "C": "G", "G": "C" };
        return [...dnaSequence].map(base=>complementMap[base]).join("");
    }
    function getRNAComplement(rnaSequence){
        let complementMap={ "A": "U", "U": "A", "C": "G", "G": "C" };
        return [...rnaSequence].map(base=>complementMap[base]).join("");
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
            "A": "Adenine", "T": "Thymine", "U": "Uracil", "C": "Cytosine", "G": "Guanine"
        };
        return [...sequence].map(base=>baseNames[base]).join(", ");
    }
});