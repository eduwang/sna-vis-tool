import Papa from "papaparse";

function loadData(csvPath) {
    const csvFilePath = csvPath; // CSV 파일 경로
    fetch(csvFilePath)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            const encoding = detectEncoding(arrayBuffer);
            const text = decodeText(arrayBuffer, encoding); // 인코딩된 텍스트 디코딩
            parseCSV(text);
        })
        .catch(error => {
            console.error('Error loading CSV file:', error);
        });
}

window.loadData = loadData;

function detectEncoding(buffer) {
    return 'euc-kr';
}

function decodeText(arrayBuffer, encoding) {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(new Uint8Array(arrayBuffer));
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
            console.log(csvData);
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