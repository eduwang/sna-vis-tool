document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('table-body');
    const table = document.getElementById('dynamic-table');

    table.addEventListener('keydown', function(event) {
        const target = event.target;
        if (event.key === 'Tab' && target.classList.contains('tabbable')) {
            addRowAndFocusNext(target);
            event.preventDefault(); // 기본 탭 동작을 막음
        }
    });
});

function addRowAndFocusNext(currentInput) {
    const tableBody = document.getElementById('table-body');
    const newRow = tableBody.insertRow();

    for (let i = 0; i < 3; i++) { // 3 is the number of columns
        const newCell = newRow.insertCell(i);
        const input = document.createElement('input');
        input.type = 'text';
        newCell.appendChild(input);

        // 첫 번째 열의 입력 필드일 때, 다음 열의 입력 필드로 포커스 이동
        if (i === 0) {
            input.addEventListener('keydown', function(event) {
                if (event.key === 'Tab') {
                    const nextInput = newCell.nextElementSibling.querySelector('input');
                    if (nextInput) {
                        nextInput.focus();
                    } else {
                        addRowAndFocusNext(input);
                    }
                    event.preventDefault(); // 기본 탭 동작을 막음
                }
            });
        }
    }

    // 현재 입력 필드가 속한 행의 다음 행으로 포커스 이동
    const nextRow = newRow.nextElementSibling;
    if (nextRow) {
        nextRow.firstElementChild.querySelector('input').focus();
    } else {
        addRowAndFocusNext(currentInput);
    }
}
