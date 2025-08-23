const RepeatGridTool = {
    currentImage: null,
    isGridActive: false,
    gridData: {
        columns: 1,
        rows: 1,
        horizontalSpacing: 0,
        verticalSpacing: 0,
        elementSize: 100,
        elementText: 'Item'
    },
    dragState: {
        isDragging: false,
        dragType: null,
        startX: 0,
        startY: 0,
        initialCols: 1,
        initialRows: 1,
        spacingIndex: -1
    },
    elements: {},
    boundHandleDrag: null,
    boundEndDrag: null,

    init: function() {
        // Element references
        this.elements.canvas = document.getElementById('rg-canvas');
        this.elements.originalElement = document.getElementById('rg-originalElement');
        this.elements.dropZone = document.getElementById('rg-dropZone');
        this.elements.fileInput = document.getElementById('rg-fileInput');
        this.elements.repeatGridBtn = document.getElementById('rg-repeatGridBtn');
        this.elements.resetBtn = document.getElementById('rg-resetBtn');
        this.elements.elementPreview = document.getElementById('rg-elementPreview');
        this.elements.gridControls = document.getElementById('rg-gridControls');
        this.elements.gridInfo = document.getElementById('rg-gridInfo');
        this.elements.elementSize = document.getElementById('rg-elementSize');
        this.elements.elementText = document.getElementById('rg-elementText');
        this.elements.importFile = document.getElementById('rg-importFile');

        // Bind drag handlers once
        this.boundHandleDrag = this.handleDrag.bind(this);
        this.boundEndDrag = this.endDrag.bind(this);

        // File handling
        this.elements.dropZone.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.elements.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.elements.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.elements.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Element controls
        this.elements.elementSize.addEventListener('input', this.updateElementSize.bind(this));
        this.elements.elementText.addEventListener('input', this.updateElementText.bind(this));

        // Repeat Grid functionality
        this.elements.repeatGridBtn.addEventListener('click', this.createRepeatGrid.bind(this));
        this.elements.resetBtn.addEventListener('click', this.resetGrid.bind(this));

        // Import functionality
        this.elements.importFile.addEventListener('change', this.handleImport.bind(this));

        // Add export buttons functionality
        document.getElementById('rg-export-json-btn').addEventListener('click', this.exportGrid.bind(this));
        document.getElementById('rg-export-svg-btn').addEventListener('click', this.exportAsSVG.bind(this));
        document.getElementById('rg-import-btn').addEventListener('click', () => this.elements.importFile.click());
    },

    handleDragOver: function(e) {
        e.preventDefault();
        this.elements.dropZone.classList.add('drag-over');
    },

    handleDragLeave: function(e) {
        e.preventDefault();
        this.elements.dropZone.classList.remove('drag-over');
    },

    handleDrop: function(e) {
        e.preventDefault();
        this.elements.dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.loadImage(files[0]);
        }
    },

    handleFileSelect: function(e) {
        if (e.target.files.length > 0) {
            this.loadImage(e.target.files[0]);
        }
    },

    loadImage: function(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (PNG, JPG, etc.)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = e.target.result;
            this.elements.originalElement.style.backgroundImage = `url(${this.currentImage})`;
            this.elements.originalElement.style.backgroundSize = 'cover';
            this.elements.originalElement.style.backgroundPosition = 'center';
            this.elements.originalElement.textContent = '';

            this.elements.elementPreview.style.backgroundImage = `url(${this.currentImage})`;
            this.elements.elementPreview.style.backgroundSize = 'cover';
            this.elements.elementPreview.style.backgroundPosition = 'center';

            this.elements.repeatGridBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    },

    updateElementSize: function() {
        this.gridData.elementSize = parseInt(this.elements.elementSize.value);
        this.elements.originalElement.style.width = this.gridData.elementSize + 'px';
        this.elements.originalElement.style.height = this.gridData.elementSize + 'px';

        if (this.isGridActive) {
            this.updateGrid();
        }
    },

    updateElementText: function() {
        this.gridData.elementText = this.elements.elementText.value;
        if (!this.currentImage) {
            this.elements.originalElement.textContent = this.gridData.elementText;
        }

        if (this.isGridActive) {
            this.updateGrid();
        }
    },

    createRepeatGrid: function() {
        if (this.isGridActive) return;

        this.isGridActive = true;
        this.elements.originalElement.classList.add('selected');
        this.elements.repeatGridBtn.disabled = true;
        this.elements.resetBtn.disabled = false;
        this.elements.gridControls.style.display = 'block';

        this.createHandles();
        this.updateGrid();
    },

    createHandles: function() {
        const rightHandle = document.createElement('div');
        rightHandle.className = 'grid-handle handle-right';
        rightHandle.id = 'rg-rightHandle';
        this.elements.originalElement.appendChild(rightHandle);

        const bottomHandle = document.createElement('div');
        bottomHandle.className = 'grid-handle handle-bottom';
        bottomHandle.id = 'rg-bottomHandle';
        this.elements.originalElement.appendChild(bottomHandle);

        rightHandle.addEventListener('mousedown', (e) => this.startDrag(e, 'horizontal'));
        bottomHandle.addEventListener('mousedown', (e) => this.startDrag(e, 'vertical'));
    },

    startDrag: function(e, type) {
        e.preventDefault();
        this.dragState.isDragging = true;
        this.dragState.dragType = type;
        this.dragState.startX = e.clientX;
        this.dragState.startY = e.clientY;
        this.dragState.initialCols = this.gridData.columns;
        this.dragState.initialRows = this.gridData.rows;

        window.addEventListener('mousemove', this.boundHandleDrag);
        window.addEventListener('mouseup', this.boundEndDrag);
    },

    handleDrag: function(e) {
        if (!this.dragState.isDragging) return;

        const deltaX = e.clientX - this.dragState.startX;
        const deltaY = e.clientY - this.dragState.startY;

        if (this.dragState.dragType === 'horizontal') {
            const itemWidth = this.gridData.elementSize;
            const newCols = Math.max(1, this.dragState.initialCols + Math.round(deltaX / itemWidth));
            if (newCols !== this.gridData.columns) {
                this.gridData.columns = newCols;
                this.updateGrid();
            }
        } else if (this.dragState.dragType === 'vertical') {
            const itemHeight = this.gridData.elementSize;
            const newRows = Math.max(1, this.dragState.initialRows + Math.round(deltaY / itemHeight));
            if (newRows !== this.gridData.rows) {
                this.gridData.rows = newRows;
                this.updateGrid();
            }
        } else if (this.dragState.dragType === 'spacing-h') {
            this.gridData.horizontalSpacing = Math.max(0, this.gridData.horizontalSpacing + deltaX / 2);
            this.updateGrid();
        } else if (this.dragState.dragType === 'spacing-v') {
            this.gridData.verticalSpacing = Math.max(0, this.gridData.verticalSpacing + deltaY / 2);
            this.updateGrid();
        }
    },

    endDrag: function() {
        this.dragState.isDragging = false;
        this.dragState.dragType = null;
        window.removeEventListener('mousemove', this.boundHandleDrag);
        window.removeEventListener('mouseup', this.boundEndDrag);
    },

    updateGrid: function() {
        const existingGrid = this.elements.canvas.querySelector('.repeat-grid');
        if (existingGrid) {
            existingGrid.remove();
        }

        this.elements.canvas.querySelectorAll('.spacing-handle').forEach(h => h.remove());

        if (this.gridData.columns === 1 && this.gridData.rows === 1) {
            this.updateGridInfo();
            return;
        }

        const gridContainer = document.createElement('div');
        gridContainer.className = 'repeat-grid';
        this.elements.canvas.appendChild(gridContainer);

        const startX = 50;
        const startY = 50;

        for (let row = 0; row < this.gridData.rows; row++) {
            for (let col = 0; col < this.gridData.columns; col++) {
                if (row === 0 && col === 0) continue;

                const item = document.createElement('div');
                item.className = 'repeated-item';

                const x = startX + col * (this.gridData.elementSize + this.gridData.horizontalSpacing);
                const y = startY + row * (this.gridData.elementSize + this.gridData.verticalSpacing);

                item.style.left = x + 'px';
                item.style.top = y + 'px';
                item.style.width = this.gridData.elementSize + 'px';
                item.style.height = this.gridData.elementSize + 'px';

                if (this.currentImage) {
                    item.style.backgroundImage = `url(${this.currentImage})`;
                } else {
                    item.style.background = '#007acc';
                    item.textContent = this.gridData.elementText + ' ' + (row * this.gridData.columns + col + 1);
                }

                gridContainer.appendChild(item);
            }
        }

        this.createSpacingHandles();
        this.updateGridInfo();
    },

    createSpacingHandles: function() {
        const startX = 50;
        const startY = 50;

        if (this.gridData.columns > 1) {
            for (let row = 0; row < this.gridData.rows; row++) {
                for (let col = 0; col < this.gridData.columns - 1; col++) {
                    const handle = document.createElement('div');
                    handle.className = 'spacing-handle spacing-handle-h';
                    const x = startX + col * (this.gridData.elementSize + this.gridData.horizontalSpacing) + this.gridData.elementSize;
                    const y = startY + row * (this.gridData.elementSize + this.gridData.verticalSpacing);
                    handle.style.left = x + 'px';
                    handle.style.top = y + 'px';
                    handle.style.width = this.gridData.horizontalSpacing + 'px';
                    handle.style.height = this.gridData.elementSize + 'px';
                    handle.addEventListener('mousedown', (e) => this.startDrag(e, 'spacing-h'));
                    this.elements.canvas.appendChild(handle);
                }
            }
        }

        if (this.gridData.rows > 1) {
            for (let row = 0; row < this.gridData.rows - 1; row++) {
                for (let col = 0; col < this.gridData.columns; col++) {
                    const handle = document.createElement('div');
                    handle.className = 'spacing-handle spacing-handle-v';
                    const x = startX + col * (this.gridData.elementSize + this.gridData.horizontalSpacing);
                    const y = startY + row * (this.gridData.elementSize + this.gridData.verticalSpacing) + this.gridData.elementSize;
                    handle.style.left = x + 'px';
                    handle.style.top = y + 'px';
                    handle.style.width = this.gridData.elementSize + 'px';
                    handle.style.height = this.gridData.verticalSpacing + 'px';
                    handle.addEventListener('mousedown', (e) => this.startDrag(e, 'spacing-v'));
                    this.elements.canvas.appendChild(handle);
                }
            }
        }
    },

    updateGridInfo: function() {
        this.elements.gridInfo.innerHTML = `
            Columns: ${this.gridData.columns}, Rows: ${this.gridData.rows}<br>
            Total Items: ${this.gridData.columns * this.gridData.rows}<br>
            H Spacing: ${Math.round(this.gridData.horizontalSpacing)}px<br>
            V Spacing: ${Math.round(this.gridData.verticalSpacing)}px
        `;
    },

    resetGrid: function() {
        this.isGridActive = false;
        this.gridData.columns = 1;
        this.gridData.rows = 1;

        this.elements.originalElement.classList.remove('selected');
        this.elements.canvas.querySelectorAll('.grid-handle').forEach(h => h.remove());
        this.elements.canvas.querySelectorAll('.repeat-grid').forEach(g => g.remove());
        this.elements.canvas.querySelectorAll('.spacing-handle').forEach(h => h.remove());

        this.elements.repeatGridBtn.disabled = this.currentImage === null;
        this.elements.resetBtn.disabled = true;
        this.elements.gridControls.style.display = 'none';
    },

    exportGrid: function() {
        const data = { ...this.gridData, hasImage: this.currentImage !== null, image: this.currentImage, timestamp: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'repeat-grid.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    exportAsSVG: function() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '700');
        svg.setAttribute('height', '700');
        svg.setAttribute('viewBox', '0 0 700 700');

        for (let row = 0; row < this.gridData.rows; row++) {
            for (let col = 0; col < this.gridData.columns; col++) {
                const x = 50 + col * this.gridData.elementSize;
                const y = 50 + row * this.gridData.elementSize;
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', x);
                rect.setAttribute('y', y);
                rect.setAttribute('width', this.gridData.elementSize);
                rect.setAttribute('height', this.gridData.elementSize);
                rect.setAttribute('fill', this.currentImage ? 'url(#pattern)' : '#007acc');
                rect.setAttribute('rx', '0');
                svg.appendChild(rect);

                if (!this.currentImage) {
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', x + this.gridData.elementSize / 2);
                    text.setAttribute('y', y + this.gridData.elementSize / 2 + 5);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('fill', 'white');
                    text.setAttribute('font-family', 'sans-serif');
                    text.setAttribute('font-weight', 'bold');
                    text.textContent = this.gridData.elementText + ' ' + (row * this.gridData.columns + col + 1);
                    svg.appendChild(text);
                }
            }
        }

        if (this.currentImage) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
            pattern.setAttribute('id', 'pattern');
            pattern.setAttribute('patternUnits', 'userSpaceOnUse');
            pattern.setAttribute('width', this.gridData.elementSize);
            pattern.setAttribute('height', this.gridData.elementSize);
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttribute('href', this.currentImage);
            image.setAttribute('width', this.gridData.elementSize);
            image.setAttribute('height', this.gridData.elementSize);
            pattern.appendChild(image);
            defs.appendChild(pattern);
            svg.insertBefore(defs, svg.firstChild);
        }

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'repeat-grid.svg';
        a.click();
        URL.revokeObjectURL(url);
    },

    handleImport: function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.gridData = { ...data };
                this.elements.elementSize.value = data.elementSize || 100;
                this.elements.elementText.value = data.elementText || 'Item';
                if (data.image) {
                    this.currentImage = data.image;
                    this.elements.originalElement.style.backgroundImage = `url(${this.currentImage})`;
                    this.elements.elementPreview.style.backgroundImage = `url(${this.currentImage})`;
                    this.elements.repeatGridBtn.disabled = false;
                }
                this.updateElementSize();
                this.updateElementText();
                alert('Grid imported successfully!');
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
};
