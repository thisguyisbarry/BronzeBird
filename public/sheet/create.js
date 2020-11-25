$('#characterForm').validate({
    rules: {
        characterName: {
            required: true,
        },
        characterRace: {
            required: true,
        },
        characterClass: {
            required: true,
        },
        characterLevel: {
            required: true
        },
        characterAlignment: {
            required: true
        },
    },
    submitHandler: createAjaxPostCharacter
});

function createAjaxPostCharacter(){
    const data = {
        characterName:       $('#characterName')[0].value,
        characterRace:       $('#characterRace')[0].value,
        characterClass:      $('#characterClass')[0].value,
        characterLevel:      $('#characterLevel')[0].value,
        characterAlignment:  $('#characterAlignment')[0].value,
    }
    const post = $.post('http://localhost:3001/submitCharacter', data);
    post.done(processResults);
    post.fail(processFailed);
}

$('#btnConfirm').click(function() {
   $('#characterForm').submit(); 
});



function processResults(rows, status, xhr){
    console.log('Data sent to server');
    
}

function processFailed(){
    console.log("Validation failed");
}


