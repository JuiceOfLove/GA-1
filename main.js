// main.js

/*
  Разработчик: Иван Иванов
  Email: ivan.ivanov@example.com
  Учебный курс: Основы генетических алгоритмов
  Год разработки: 2023
*/

let network;

document.getElementById('startButton').addEventListener('click', () => {
  const networkSize = parseInt(document.getElementById('networkSize').value);
  const populationSize = parseInt(document.getElementById('populationSize').value);
  const numGenerations = parseInt(document.getElementById('numGenerations').value);
  const mutationRate = parseFloat(document.getElementById('mutationRate').value);
  const crossoverRate = parseFloat(document.getElementById('crossoverRate').value);
  const startNode = parseInt(document.getElementById('startNode').value);
  const endNode = parseInt(document.getElementById('endNode').value);
  const mode = document.getElementById('mode').value;

  if (startNode >= networkSize || endNode >= networkSize) {
    alert('Отправитель и получатель должны быть в пределах размера сети.');
    return;
  }

  // Отключаем кнопку запуска
  document.getElementById('startButton').disabled = true;

  // Получаем обновленную матрицу из элементов ввода
  const matrix = [];
  for (let i = 0; i < networkSize; i++) {
    matrix[i] = [];
    for (let j = 0; j < networkSize; j++) {
      const cellValue = parseFloat(document.getElementById(`cell-${i}-${j}`).value);
      matrix[i][j] = isNaN(cellValue) ? 0 : cellValue;
    }
  }

  // Создаем объект сети
  network = {
    size: networkSize,
    matrix: matrix
  };

  // Создаем новый веб-воркер
  const worker = new Worker('worker.js');

  // Отправляем параметры в воркер
  worker.postMessage({
    network: network,
    populationSize: populationSize,
    numGenerations: numGenerations,
    mutationRate: mutationRate,
    crossoverRate: crossoverRate,
    startNode: startNode,
    endNode: endNode,
    mode: mode
  });

  // Очищаем предыдущий вывод
  document.getElementById('output').textContent = '';

  // Обрабатываем сообщения от воркера
  worker.onmessage = function(e) {
    const data = e.data;
    if (data.type === 'progress') {
      // Обновляем вывод с прогрессом
      document.getElementById('output').textContent += data.message;
    } else if (data.type === 'result') {
      // Отображаем финальный результат
      document.getElementById('output').textContent += data.message;
      // Включаем кнопку запуска
      document.getElementById('startButton').disabled = false;
      // Завершаем воркер
      worker.terminate();
    }
  };

  // Обрабатываем ошибки воркера
  worker.onerror = function(e) {
    console.error('Ошибка воркера:', e);
    alert('Произошла ошибка при выполнении алгоритма.');
    document.getElementById('startButton').disabled = false;
    worker.terminate();
  };
});

// Инициализируем матрицу сети при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  const networkSizeInput = document.getElementById('networkSize');

  function renderNetworkMatrix() {
    const networkSize = parseInt(networkSizeInput.value);
    network = new Network(networkSize);
    network.renderMatrix('matrix');
  }

  // Отрисовываем начальную матрицу
  renderNetworkMatrix();

  // Обновляем матрицу при изменении размера сети
  networkSizeInput.addEventListener('change', renderNetworkMatrix);
});

class Network {
  constructor(size) {
    this.size = size;
    this.matrix = this.generateMatrix(size);
  }

  generateMatrix(size) {
    const matrix = [];
    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j <= i; j++) {
            if (i === j) {
                matrix[i][j] = 0; // Петля
            } else {
                const cost = Math.floor(Math.random() * 10) + 1;
                matrix[i][j] = cost;
                matrix[j][i] = cost; // Обеспечиваем симметрию
            }
        }
    }
    return matrix;
}

  updateMatrix(i, j, value) {
    this.matrix[i][j] = value;
  }

  renderMatrix(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<h2>Матрица смежности сети:</h2>';
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th'));
    for (let i = 0; i < this.size; i++) {
      const th = document.createElement('th');
      th.textContent = i;
      headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    for (let i = 0; i < this.size; i++) {
      const row = document.createElement('tr');
      const th = document.createElement('th');
      th.textContent = i;
      row.appendChild(th);
      for (let j = 0; j < this.size; j++) {
        const cell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.value = this.matrix[i][j];
        input.min = '0';
        input.id = `cell-${i}-${j}`;
        input.addEventListener('change', (e) => {
          const value = parseFloat(e.target.value);
          this.updateMatrix(i, j, isNaN(value) ? 0 : value);
          if (i !== j) {
              this.updateMatrix(j, i, isNaN(value) ? 0 : value); // Обеспечиваем симметрию
              document.getElementById(`cell-${j}-${i}`).value = value; // Обновляем связанный элемент ввода
          }
      });
        cell.appendChild(input);
        row.appendChild(cell);
      }
      table.appendChild(row);
    }
    container.appendChild(table);
  }
}
