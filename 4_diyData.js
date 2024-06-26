document.getElementById('add-row').addEventListener('click', addRow);

// 이벤트 델리게이션을 사용하여 동적으로 추가된 버튼에도 이벤트 리스너를 등록
document.getElementById('dynamic-table').addEventListener('click', function(event) {
    if (event.target && event.target.classList.contains('delete-row')) {
        deleteRow(event.target);
    }
});


function addRow() {
    const table = document.getElementById('dynamic-table').getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();

    let firstInput;
    let thirdInput;

    for (let i = 0; i < 4; i++) { // 4 is the number of columns
        const newCell = newRow.insertCell(i);
        if (i < 3) {
            const input = document.createElement('input');
            input.type = 'text';
            newCell.appendChild(input);
            if (i === 0) {
                firstInput = input; // 첫 번째 입력 요소 저장
            }
            if (i === 2) {
                thirdInput = input; // 세 번째 입력 요소 저장
            }
        } else {
            const button = document.createElement('button');
            button.textContent = 'X';
            button.className = 'delete-row'; // 클래스명을 사용하여 이벤트 델리게이션 적용
            newCell.appendChild(button);
            newCell.classList.add('deleteButtonColumn'); // add the class to the last column
        }
    }
    // 첫 번째 입력 요소에 포커스 설정
    if (firstInput) {
        firstInput.focus();
    }

    // 세 번째 입력 요소에 Tab 키 이벤트 리스너 추가
    if (thirdInput) {
        thirdInput.addEventListener('keydown', function(event) {
            if (event.key === 'Tab') {
                event.preventDefault(); // 기본 Tab 동작 방지
                addRow(); // 새 행 추가
            }
        });
    }
}

function deleteRow(button) {
    const row = button.parentElement.parentElement;
    row.parentElement.removeChild(row);
    console.log("Row deleted");
}