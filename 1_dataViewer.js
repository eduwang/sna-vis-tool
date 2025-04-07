import Papa from "papaparse";

function handleFile() {
    const input = document.getElementById('csvFileInput');
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const encoding = detectEncoding(arrayBuffer);
            const text = decodeText(arrayBuffer, encoding); // Decode the text with detected encoding
            parseCSV(text);
        };
        reader.readAsArrayBuffer(file);
    }
}
window.handleFile = handleFile;


function detectEncoding(buffer) {
    const uint8Array = new Uint8Array(buffer);

    // UTF-8 BOM: EF BB BF
    if (uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
        return 'utf-8'; // or 'utf-8-sig', TextDecoder handles it the same
    }

    // 다른 인코딩의 경우에는 수동 설정
    return 'euc-kr'; // 기본값 (필요에 따라 변경)
}

function decodeText(arrayBuffer, encoding) {
    const decoder = new TextDecoder(encoding);
    let text = decoder.decode(new Uint8Array(arrayBuffer));

    // UTF-8 with BOM (Byte Order Mark) 제거
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
    }

    return text;
}

const errorLoadingCsv = document.getElementById('error-csv-message');
const tableDisplay = document.getElementById('csvDataDisplay');
const dataCount = document.getElementById('data-count');

function parseCSV(text) {
    Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        
        complete: function(results) {
            if (!results.data[0] || results.data[0].Source1 === undefined || results.data[0].Source2 === undefined || results.data[0].Weight === undefined) {
                errorLoadingCsv.textContent = "CSV file의 각 열제목은 Source1, Source2, Weight이어야 함";
                errorLoadingCsv.style.display = 'block'; // 에러 메시지를 보이게 설정
                tableDisplay.style.display = 'none'
                dataCount.style.display = 'none'
                return;
            } else{
                errorLoadingCsv.style.display = 'none';
                tableDisplay.style.display = 'block'
                dataCount.style.display = 'block'

            }
            // Filter out rows with any empty values
            const filteredData = results.data.filter(row => {
                return Object.values(row).every(value => value !== null && value !== '');
            }).map((row, index) => ({
                ID: index + 1,
                Source1: row.Source1,
                Source2: row.Source2,
                Weight: row.Weight
            }));
            displayTable(filteredData);
            displayDataCount(filteredData.length);
            window.csvData = filteredData; // Store data globally for graph visualization
        }
    });
}

function displayDataCount(count) {
    dataCount.textContent = '전체 데이터 수: ' + count + '개의 선분 데이터';
}

function displayTable(data) {
    const csvHeader = document.getElementById('csvHeader');
    const csvBody = document.getElementById('csvBody');

    // Clear existing table data
    csvHeader.innerHTML = '';
    csvBody.innerHTML = '';

    if (data.length > 0) {
        // Create header row
        const headers = Object.keys(data[0]);
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            csvHeader.appendChild(th);
        });

        // Create data rows
        data.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header];
                tr.appendChild(td);
            });
            csvBody.appendChild(tr);
        });
    }
}