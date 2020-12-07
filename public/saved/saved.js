$(document).ready(function() {
    const post = $.get('http://localhost:3001/retrieveUserCharacters');
    console.log('Doc ready');
    post.done(buildCharacterTable);
    post.fail(displayErrorCharacterTable);
});

function buildCharacterTable(rows, status, xhr) {
    let resultsTable = `
    <table id="resultsTable" class="table">
    <thead>
        <tr>
            <th scope="col">ID</th>
            <th scope="col">Name</th>
            <th scope="col">Race</th>
            <th scope="col">Class</th>
            <th scope="col">Level</th>
            <th scope="col">Alignment</th>
            <th scope="col"></th>
            <th scope="col"></th>
        </tr>
    </thead>
    <tbody id='tableBody'>
    </tbody>
    </table>`;
    $(resultsTable).appendTo('#colTable');
    for (let i = 0; i < rows.length; i++) {
        const trId = `tr${rows[i].characterID}`;
        $(`<tr id='${trId}'></tr>`).appendTo('#tableBody');
        $(`<td> ${rows[i].characterID}</td>`).appendTo(`#${trId}`);
        $(`<td>${rows[i].characterName}</td>`).appendTo(`#${trId}`);
        $(`<td> ${rows[i].characterRace}</td>`).appendTo(`#${trId}`);
        $(`<td> ${rows[i].characterClass}</td>`).appendTo(`#${trId}`);
        $(`<td> ${rows[i].characterLevel}</td>`).appendTo(`#${trId}`);
        $(`<td> ${rows[i].characterAlignment}</td>`).appendTo(`#${trId}`);
        $(`<td><a id='delete${trId}' class='btn btn-link'>Delete</a></td>`).appendTo(`#${trId}`);

        $(`#delete${trId}`).click(deleteCharacter);
    }
}

function displayErrorCharacterTable(response, status, xhr) {
    console.log(response);
    const errors = response.responseJSON.errors;
    for (let i = 0; i < errors.length; i++) {
        $(`<div>${JSON.stringify(errors[i])}</div>`).appendTo('.container');
    }
}


function deleteCharacter() {
    const element = this.parentElement.parentElement;
    const data = {
        characterID: element.children[0].innerText,
    }
    const post = $.post('http://localhost:3001/deleteCharacter', data);
    post.done(processCharacterSuccess);
    post.fail(processUserErrors);
}

function processCharacterSuccess(rows, status, xhr) {
    $('#resultsTable').remove();
    buildCharacterTable(rows, status, xhr);
}

function processUserErrors(error, status, xhr) {
    console.log(error);
    const errorMsg = error.responseJSON.error;
    $(`<div class='alert alert-danger'>${errorMsg}</div>`).appendTo('.container');
}
