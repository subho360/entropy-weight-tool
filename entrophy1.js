function buildDecisionMatrix() {
    const m = Math.max(2, Math.min(50, parseInt(document.getElementById('m').value || 4)));
    const n = Math.max(1, Math.min(30, parseInt(document.getElementById('n').value || 3)));
    const names = (document.getElementById('critNames').value || '').split(',').map(s => s.trim()).filter(Boolean);

    const critLabels =
        names.length >= n ? names.slice(0, n) :
            Array.from({ length: n }, (_, i) => names[i] || ('C' + (i + 1)));

    let html = '<table class="table table-sm"><thead><tr><th>Alt \\ Crit</th>';

    for (let j = 0; j < n; j++)
        html += `<th><input class="form-control form-control-sm critName" data-index="${j}" value="${critLabels[j]}"/></th>`;

    html += '</tr></thead><tbody>';

    for (let i = 0; i < m; i++) {
        html += `<tr><th><input class="form-control form-control-sm altName" data-index="${i}" value="A${i + 1}"/></th>`;
        for (let j = 0; j < n; j++)
            html += `<td><input type="number" class="form-control form-control-sm val" data-i="${i}" data-j="${j}" value="0" step="any"/></td>`;
        html += '</tr>';
    }

    html += '</tbody></table>';
    document.getElementById('matrixArea').innerHTML = html;
}

function getMatrix() {
    const m = parseInt(document.getElementById('m').value || 4);
    const n = parseInt(document.getElementById('n').value || 3);

    const altNames = Array.from(document.querySelectorAll('.altName')).map(el => el.value);
    const critNames = Array.from(document.querySelectorAll('.critName')).map(el => el.value);

    const matrix = Array.from({ length: m }, () => Array(n).fill(0));

    document.querySelectorAll('.val').forEach(el => {
        const i = +el.dataset.i, j = +el.dataset.j;
        matrix[i][j] = parseFloat(el.value) || 0;
    });

    return { m, n, altNames, critNames, matrix };
}

function computeEntropy() {
    const { m, n, altNames, critNames, matrix } = getMatrix();

    let norm = Array.from({ length: m }, () => Array(n).fill(0));

    for (let j = 0; j < n; j++) {
        let colsum = 0;
        for (let i = 0; i < m; i++) colsum += matrix[i][j];
        for (let i = 0; i < m; i++) norm[i][j] = colsum ? matrix[i][j] / colsum : 0;
    }

    const k = 1 / Math.log(m);
    let E = Array(n).fill(0);

    for (let j = 0; j < n; j++) {
        for (let i = 0; i < m; i++) {
            if (norm[i][j] > 0)
                E[j] += -k * norm[i][j] * Math.log(norm[i][j]);
        }
    }

    let d = E.map(e => 1 - e);
    const dsum = d.reduce((a, b) => a + b, 0) || 1;

    let w = d.map(x => x / dsum);
    return { altNames, critNames, matrix, E, d, w };
}

function renderEntropy() {
    const { critNames, E, d, w } = computeEntropy();

    let html = '<table class="table table-sm"><thead><tr><th>Criterion</th><th>Entropy</th><th>Divergence</th><th>Weight</th></tr></thead><tbody>';

    for (let j = 0; j < critNames.length; j++) {
        html += `<tr>
      <td>${critNames[j]}</td>
      <td>${E[j].toFixed(4)}</td>
      <td>${d[j].toFixed(4)}</td>
      <td><strong>${w[j].toFixed(4)}</strong></td>
    </tr>`;
    }

    html += '</tbody></table>';
    document.getElementById('resultsArea').innerHTML = html;
}

function exportCSV() {
    const { critNames, E, d, w } = computeEntropy();

    let csv = 'Criterion,Entropy,Divergence,Weight\n';
    critNames.forEach((c, j) => {
        csv += `${c},${E[j]},${d[j]},${w[j]}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entropy_results.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function exportJSON() {
    const res = computeEntropy();
    const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entropy_results.json';
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('build').addEventListener('click', buildDecisionMatrix);
document.getElementById('compute').addEventListener('click', renderEntropy);
document.getElementById('exportCsv').addEventListener('click', exportCSV);
document.getElementById('exportJson').addEventListener('click', exportJSON);

buildDecisionMatrix();
