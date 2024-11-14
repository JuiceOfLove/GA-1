// worker.js

/*
  Разработчик: Иван Иванов
  Email: ivan.ivanov@example.com
  Учебный курс: Основы генетических алгоритмов
  Год разработки: 2023
*/

self.addEventListener('message', function(e) {
    const params = e.data;
    const ga = new GeneticAlgorithm({
      network: params.network,
      populationSize: params.populationSize,
      numGenerations: params.numGenerations,
      mutationRate: params.mutationRate,
      crossoverRate: params.crossoverRate,
      startNode: params.startNode,
      endNode: params.endNode,
      mode: params.mode
    });

    ga.run();
});

class GeneticAlgorithm {
    constructor(params) {
      this.network = params.network;
      this.populationSize = params.populationSize || 10;
      this.numGenerations = params.numGenerations || 20;
      this.mutationRate = params.mutationRate || 0.3;
      this.crossoverRate = params.crossoverRate || 0.8;
      this.startNode = params.startNode;
      this.endNode = params.endNode;
      this.population = [];
      this.mode = params.mode || 'cyclic'; // 'step' или 'cyclic'
      this.output = '';
    }

    initializePopulation() {
        this.population = [];

        // Проверяем наличие прямого пути и добавляем его
        if (this.network.matrix[this.startNode][this.endNode] > 0) {
            this.population.push([]);
        }

        // Генерируем оставшиеся хромосомы
        while (this.population.length < this.populationSize) {
            let chromosome = this.generateChromosome();
            if (chromosome.length > 0 && this.fitness(chromosome) !== Infinity) {
                this.population.push(chromosome);
            }
        }
    }


    generateChromosome() {
        // Генерируем случайный допустимый путь от startNode до endNode
        let path = this.randomWalk(this.startNode, this.endNode);
        // Убираем стартовую и конечную вершины из хромосомы
        let chromosome = path.slice(1, -1);
        return chromosome;
    }

    randomWalk(start, end) {
        let path = [start];
        let currentNode = start;
        let visited = new Set([start]);

        let maxAttempts = this.network.size * 10; // Предотвращение бесконечного цикла
        let attempts = 0;

        while (currentNode !== end && attempts < maxAttempts) {
            attempts++;

            // Получаем список соседей текущей вершины
            let neighbors = [];
            for (let i = 0; i < this.network.size; i++) {
                if (this.network.matrix[currentNode][i] > 0 && !visited.has(i)) {
                    neighbors.push(i);
                }
            }

            if (neighbors.length === 0) {
                // Если нет непройденных соседей, возвращаемся назад
                if (path.length === 1) {
                    // Если вернулись к стартовой точке и нет вариантов, возвращаем пустой путь
                    return [];
                }
                visited.delete(currentNode);
                path.pop();
                currentNode = path[path.length - 1];
                continue;
            }

            // Случайно выбираем следующую вершину
            let nextNode = neighbors[Math.floor(Math.random() * neighbors.length)];
            path.push(nextNode);
            visited.add(nextNode);
            currentNode = nextNode;
        }

        if (currentNode === end) {
            return path;
        } else {
            return [];
        }
    }

    fitness(chromosome) {
        let totalCost = 0;
        let path = [this.startNode, ...chromosome, this.endNode];
        for (let i = 0; i < path.length - 1; i++) {
            const fromNode = path[i];
            const toNode = path[i + 1];
            const cost = this.network.matrix[fromNode][toNode];
            if (cost <= 0 || cost === undefined || isNaN(cost)) {
                return Infinity;
            }
            totalCost += cost;
        }
        return totalCost;
    }

    selection() {
        let newPopulation = [];
        // Элитизм
        newPopulation.push(this.getBestChromosome());

        while (newPopulation.length < this.populationSize) {
            let tournamentSize = 3;
            let tournament = [];
            for (let i = 0; i < tournamentSize; i++) {
                tournament.push(this.population[Math.floor(Math.random() * this.population.length)]);
            }
            // С вероятностью 0.75 выбираем лучшего, иначе случайного
            let selected;
            if (Math.random() < 0.75) {
                selected = tournament.reduce((best, curr) => (this.fitness(curr) < this.fitness(best) ? curr : best));
            } else {
                selected = tournament[Math.floor(Math.random() * tournament.length)];
            }
            newPopulation.push(selected);
        }

        this.population = newPopulation;
    }

    crossover() {
        let newPopulation = [];
        // Перемешиваем популяцию для случайного выбора пар
        let shuffledPopulation = this.population.slice();
        for (let i = shuffledPopulation.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPopulation[i], shuffledPopulation[j]] = [shuffledPopulation[j], shuffledPopulation[i]];
        }

        for (let i = 0; i < this.populationSize; i += 2) {
            let parent1 = shuffledPopulation[i];
            let parent2 = shuffledPopulation[i + 1] || shuffledPopulation[0];
            if (Math.random() < this.crossoverRate) {
                let [child1, child2] = this.partiallyMappedCrossover(parent1, parent2);
                newPopulation.push(child1, child2);
            } else {
                newPopulation.push(parent1, parent2);
            }
        }
        this.population = newPopulation.slice(0, this.populationSize);
    }

    partiallyMappedCrossover(parent1, parent2) {
        // Оператор PMX (Partially Mapped Crossover)
        let size = parent1.length;
        if (size === 0) {
            return [parent1.slice(), parent2.slice()];
        }

        let start = Math.floor(Math.random() * size);
        let end = Math.floor(Math.random() * size);

        if (start > end) {
            [start, end] = [end, start];
        }

        let child1 = new Array(size).fill(null);
        let child2 = new Array(size).fill(null);

        // Копируем сегмент от родителей
        for (let i = start; i <= end; i++) {
            child1[i] = parent2[i];
            child2[i] = parent1[i];
        }

        // Заполняем оставшиеся позиции
        let fillChild = (child, parent, start, end) => {
            for (let i = 0; i < size; i++) {
                if (i >= start && i <= end) continue;
                let gene = parent[i];
                while (child.includes(gene)) {
                    let index = parent.indexOf(gene);
                    gene = parent[index];
                }
                child[i] = gene;
            }
        };

        fillChild(child1, parent1, start, end);
        fillChild(child2, parent2, start, end);

        // Ремонтируем хромосомы
        child1 = this.repairChromosome(child1);
        child2 = this.repairChromosome(child2);

        return [child1, child2];
    }

    mutation() {
        for (let i = 0; i < this.populationSize; i++) {
            if (Math.random() < this.mutationRate) {
                let chromosome = this.population[i];
                let mutationType = Math.floor(Math.random() * 4); // Теперь 4 типа мутаций
                if (mutationType === 0 && chromosome.length > 1) {
                    // Смена мест двух генов
                    let index1 = Math.floor(Math.random() * chromosome.length);
                    let index2 = Math.floor(Math.random() * chromosome.length);
                    [chromosome[index1], chromosome[index2]] = [chromosome[index2], chromosome[index1]];
                } else if (mutationType === 1) {
                    // Добавление нового гена
                    // Код добавления гена
                } else if (mutationType === 2 && chromosome.length > 0) {
                    // Удаление гена
                    // Код удаления гена
                } else {
                    // Полная замена хромосомы
                    chromosome = this.generateChromosome();
                }
                this.population[i] = this.repairChromosome(chromosome);
            }
        }
    }

    adjustMutationRate(generation) {
        // Например, уменьшаем вероятность мутации со временем
        this.mutationRate = Math.max(0.1, 0.5 - (generation / this.numGenerations) * 0.4);
    }

    repairChromosome(genes) {
        // Убираем дубликаты, сохраняя порядок
        let uniqueGenes = [];
        let geneSet = new Set();
        for (let gene of genes) {
            if (!geneSet.has(gene)) {
                uniqueGenes.push(gene);
                geneSet.add(gene);
            }
        }

        // Проверяем валидность пути
        let path = [this.startNode, ...uniqueGenes, this.endNode];
        if (this.isValidPath(path)) {
            return uniqueGenes;
        } else {
            // Если путь недействителен, пытаемся удалить гены до получения допустимого пути
            for (let i = uniqueGenes.length - 1; i >= 0; i--) {
                let subGenes = uniqueGenes.slice(0, i);
                let subPath = [this.startNode, ...subGenes, this.endNode];
                if (this.isValidPath(subPath)) {
                    return subGenes;
                }
            }
            // Если не удалось получить допустимый путь, возвращаем пустую хромосому
            return [];
        }
    }

    isValidPath(path) {
        for (let i = 0; i < path.length - 1; i++) {
            const cost = this.network.matrix[path[i]][path[i + 1]];
            if (cost <= 0 || cost === undefined || isNaN(cost)) {
                return false;
            }
        }
        return true;
    }

    async run() {
        this.initializePopulation();
        for (let generation = 0; generation < this.numGenerations; generation++) {
            this.adjustMutationRate(generation);
            if (this.mode === 'step') {
                this.output += `Поколение ${generation + 1}:\n`;
                this.output += 'Популяция до селекции:\n';
                this.output += this.getPopulationString();
            }

            this.selection();

            if (this.mode === 'step') {
                this.output += 'Популяция после селекции:\n';
                this.output += this.getPopulationString();
            }

            this.crossover();

            if (this.mode === 'step') {
                this.output += 'Популяция после кроссовера:\n';
                this.output += this.getPopulationString();
            }

            this.mutation();

            if (this.mode === 'step') {
                this.output += 'Популяция после мутации:\n';
                this.output += this.getPopulationString();
                this.output += '-----------------------------------\n';
            }

            // Отправляем прогресс
            if (generation % 1 === 0) {
                self.postMessage({ type: 'progress', message: this.output });
                this.output = '';
                await sleep(10);
            }
        }

        // Выводим лучший путь
        let bestChromosome = this.getBestChromosome();
        let bestPath = [this.startNode, ...bestChromosome, this.endNode];
        let bestCost = this.fitness(bestChromosome);
        this.output += 'Лучший найденный путь: ' + bestPath.join(' -> ') + '\n';
        this.output += 'Суммарная стоимость: ' + bestCost + '\n';

        // Отправляем финальный результат
        self.postMessage({ type: 'result', message: this.output });
    }

    getBestChromosome() {
        return this.population.reduce((best, curr) => {
            return this.fitness(curr) < this.fitness(best) ? curr : best;
        });
    }

    getPopulationString() {
        let str = '';
        this.population.forEach((chromosome, index) => {
            let path = [this.startNode, ...chromosome, this.endNode];
            let fitnessValue = this.fitness(chromosome);
            let fitnessText = fitnessValue === Infinity ? 'Недействительный путь' : 'Стоимость - ' + fitnessValue;
            str += `Хромосома ${index + 1}: Путь - ${path.join(' -> ')}, ${fitnessText}\n`;
        });
        return str;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
