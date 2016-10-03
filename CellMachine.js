function Machine(param) {
	var canvas = document.createElement('canvas')
    var div = document.getElementById(param.container)
    canvas.width = param.size * param.width
    canvas.height = param.size * param.height
    div.appendChild(canvas)
    var grid = []
    for (var i = 0; i < param.width * param.height; i++) {
    	grid[i] = { jump: jump }
    	grid[i].id = i
    	grid[i].y = Math.floor(i / param.width)
    	grid[i].x = i % param.width
    }
    var ctx = canvas.getContext('2d')
	var devicePixelRatio = window.devicePixelRatio || 1,
	backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
	                    ctx.mozBackingStorePixelRatio ||
	                    ctx.msBackingStorePixelRatio ||
	                    ctx.oBackingStorePixelRatio ||
	                    ctx.backingStorePixelRatio || 1,
	ratio = devicePixelRatio / backingStoreRatio

	var oldWidth = canvas.width
	var oldHeight = canvas.height
	canvas.width = oldWidth * ratio
	canvas.height = oldHeight * ratio
	canvas.style.width = oldWidth + 'px'
	canvas.style.height = oldHeight + 'px'
	ctx.scale(ratio, ratio)

	this.init = function(a) {
		var gridIds = []
		for (var i = 0; i < grid.length; i++)
			gridIds[i] = i
		for (var i = 0; i < a.length; i++) {
			var min = grid.length * a[i][1]
			if (grid.length * a[i][1] > gridIds.length)
				min = gridIds.length
			for (var j = 0; j < min; j++) {
				var id = Math.floor(Math.random() * gridIds.length)
				grid[gridIds[id]].jump(a[i][0])
				for (var key in a[i][2])
					grid[gridIds[id]][key] = a[i][2][key]
				grid[gridIds[id]].from = []
				gridIds.splice(id, 1)
			}
		}
		this.visualize()
	}

	this.map = function(x, y, a, legend) {
		var m = this
		for (var i = 0; i < a.length; i++)
			for (var j = 0; j < a[i].length; j++)
				if (m.grid[(i + y) * m.width + j + x])
					for (var key in legend[a[i][j]])
						if (key == 'type')
							m.grid[(i + y) * m.width + j + x].jump(legend[a[i][j]][key])
						else
							m.grid[(i + y) * m.width + j + x][key] = cloneObject(legend[a[i][j]][key])
		m.visualize()
	}

	this.save = function(name) {
		var m = this
		var s = name + ' = [['
		var x = 1
		for (var i = 0; i < m.grid.length; i++) {
			if (x > m.width) {
				s += '],'
				x = 1
				s += '['
			}
			s += m.grid[i].color
			if (x < m.width)
				s += ','
			x++
		}
		s += ']]'
		var dl = document.createElement('a')
		dl.href = 'data:text/json;charset=utf-8,' + escape(s)
		dl.download = name + '.js'
		dl.click()
	}

	this.visualize = function() {
		var m = this
		var ctx = m.canvas.getContext('2d')

		//hex
		if (this.hex) {
			drawHexGrid(this)
			return
		}
		//_hex

		for (var i = 0; i < m.grid.length; i++) {
			if (m.grid[i].color != null) {
				ctx.beginPath()
				ctx.fillStyle = m.colors[m.grid[i].color]
				ctx.rect(m.grid[i].x * m.size, m.grid[i].y * m.size, m.size, m.size)
				ctx.fill()
			}
		}
	}

	this.start = function(interval, after) {
		var m = this
		for (var i = 0; i < m.grid.length; i++) {
			m.grid[i].n = []
			for (var j = 0; j < m.grid.length; j++)
				if (j != i)
					if (Math.abs(m.grid[i].x - m.grid[j].x) <= m.grid[i].vision && Math.abs(m.grid[i].y - m.grid[j].y) <= m.grid[i].vision)
						m.grid[i].n.push(m.grid[j].id)
		}
		//hex
		if (this.hex) {
			for (var i = 0; i < m.grid.length; i++) {
				var used = new Array(m.grid.length)
				for (var j = 0; j < used.length; ++j) used[j] = false
				used[i] = true
				m.grid[i].n = getHexNeighbours(m.grid[i], m.grid[i].vision, m.grid, m)
			}
		}
		//_hex
		clearInterval(m.interval)
		m.interval = setInterval(function() {m.step(); if (after) after()}, interval)
	}

	this.stop = function() {
		clearInterval(this.interval)
	}

	this.step = function() {
		var m = this
		currentMachine = m
		var old_grid = cloneArray(m.grid)
		var chosen = new Array(m.grid.length)
		for (var i = 0; i < m.grid.length; i++) chosen[i] = false

		for (var i = 0; i < m.grid.length; i++)
			m.grid[i].moving = false
		for (var i = 0; i < m.grid.length; i++) {
			var n = []
			for (var j = 0; j < old_grid[i].n.length; j++)
				n.push(old_grid[old_grid[i].n[j]])
			m.grid[i].process(n)
			var moving = m.grid[i].move(n)
			m.grid[i].moving = moving
			if (moving && moving.y >= 0 && moving.x >= 0 && moving.y < this.height && moving.x < this.width)
				if (m.grid[moving.y * this.width + moving.x].from.length == 0 || m.grid[i].moving.priority > m.grid[moving.y * this.width + moving.x].from[0].moving.priority) {
					for (var j = 0; j < m.grid[moving.y * this.width + moving.x].from.length; j++)
						chosen[m.grid[moving.y * this.width + moving.x].from[j].id] = false
					m.grid[moving.y * this.width + moving.x].from = []
					m.grid[moving.y * this.width + moving.x].from.push(cloneObject(m.grid[i]))
					chosen[i] = true
				} else if (m.grid[moving.y * this.width + moving.x].from.length > 0 && m.grid[i].moving.priority == m.grid[moving.y * this.width + moving.x].from[0].moving.priority) {
					if (Math.random() > 0.5) {
						for (var j = 0; j < m.grid[moving.y * this.width + moving.x].from.length; j++)
							chosen[m.grid[moving.y * this.width + moving.x].from[j].id] = false
						m.grid[moving.y * this.width + moving.x].from = []
						m.grid[moving.y * this.width + moving.x].from.push(cloneObject(m.grid[i]))
						chosen[i] = true
					}
				}
		}
		for (var i = 0; i < m.grid.length; i++)
			if (chosen[i])
				m.grid[i].jump(m.grid[i].moving.instead)
		for (var i = 0; i < m.grid.length; i++)
			if (m.grid[i].from.length > 0) {
				var j = Math.floor(Math.random() * m.grid[i].from.length)
				m.grid[i].jump(m.grid[i].from[j], this.static)
				m.grid[i].from = []
			}
		m.visualize()
	}

    this.colors = param.colors
    this.size = param.size
    this.width = param.width
    this.height = param.height
    this.grid = grid
    this.canvas = canvas
    this.static = param.static
    this.hex = param.hex
}

function jump(type, static) {
	for(var key in type)
		if (type[key] != null && key != 'from' && key != 'x' && key != 'y' && key != 'id' && key != 'n')
			if (!static || static.indexOf(key) < 0)
				this[key] = cloneObject(type[key])
}

function cloneObject(obj) {
	if (typeof obj != "object")
		return obj
	var ans = {}
	for (var key in obj)
		if (obj[key] == null || obj[key] == undefined)
			ans[key] = obj[key]
		else if (Array.isArray(obj[key]))
			ans[key] = cloneArray(obj[key])
		else if (typeof obj[key] == "object")
			ans[key] = cloneObject(obj[key])
		else ans[key] = obj[key]
	return ans
}

function cloneArray(arr) {
	var ans = []
	for (var i = 0; i < arr.length; i++)
		if (arr[i] == null || arr[i] == undefined)
			ans.push(arr[i])
		else if (Array.isArray(arr[i]))
			ans.push(cloneArray(arr[i]))
		else if (typeof arr[i] == "object")
			ans.push(cloneObject(arr[i]))
		else ans.push(arr[i])
	return ans
}

function set(n, params, me) {
	var ans = []
	for (var i = 0; i < n.length; i++)
		if (params.isFunction && params(n[i], me))
			ans.push(n[i])
		else {
			var flag = true
			for (var key in params)
				if (params[key] != n[i][key]) {
					flag = false
					break
				}
			if (flag)
				ans.push(n[i])
		}
	return ans
}

Array.prototype.rand = function(n) {
	var ans = []
	
	if (n == 0)
		return []

	if (n > this.length)
		return this

	if (n) {
		var IDs = new Array(this.length)
		for (var i = 0; i < IDs.length; i++)
			IDs[i] = i
		while (n > 0) {
			var r = IDs[Math.floor(Math.random() * IDs.length)]
			ans.push(this[r])
			IDs.splice(r, 1)
			n--
		}
		return ans
	}
	
	return this[Math.floor(Math.random() * this.length)]
}

Array.prototype.swap = function(a, b) {
	var temp = this[a]
	this[a] = this[b]
	this[b] = temp
}

Function.prototype.isFunction = true

function drawHex(m, center, color) {
	var ctx = m.canvas.getContext('2d')
	ctx.fillStyle = color
	ctx.lineWidth = 0
	ctx.beginPath()
	var firstCorner = hexCorner(center, m.size / 2, 0)
	ctx.moveTo(firstCorner.x, firstCorner.y)
	for (var i = 1; i < 7; ++i) {
		var corner = hexCorner(center, m.size / 2, i)
		ctx.lineTo(corner.x, corner.y)
	}
	ctx.fill()
}

function hexCorner(center, size, i) {
    var angle_deg = 60 * i
    var angle_rad = Math.PI / 180 * angle_deg
    return { x: center.x + size * Math.cos(angle_rad),
             y: center.y + size * Math.sin(angle_rad) }
}

function drawHexGrid(m) {
	for (var i = 0; i < m.grid.length; ++i) {
		var evenColumn = m.grid[i].x % 2 == 0
		drawHex(m, { x: m.grid[i].x * (m.size * 3 / 4) + m.size / 2, y: m.grid[i].y * (Math.sqrt(3)/2 * m.size) + evenColumn * (Math.sqrt(3)/2 * m.size) / 2 + (Math.sqrt(3)/2 * m.size) / 2 + 1 }, m.colors[m.grid[i].color])
	}
}

function getHexNeighbours(cell, vision, grid, m) {
	var d = [
	   [ [+1, +1], [+1,  0], [ 0, -1],
	     [-1,  0], [-1, +1], [ 0, +1] ],
	   [ [+1,  0], [+1, -1], [ 0, -1],
	     [-1, -1], [-1,  0], [ 0, +1] ]
	]

	var n = []

	var h = [vision]
	for (var i = 1; i <= vision; ++i)
		if (i & 1)
			h[i] = h[i-1]
		else
			h[i] = h[i-1] - 1

	for (var i = 0; i < grid.length; ++i) {
		var _w = Math.abs(grid[i].x - cell.x)
		var _h = Math.abs(grid[i].y - cell.y)
		if ((cell.x & 1) && (_w & 1))
			if (grid[i].y > cell.y)
				_h++
		if ((!(cell.x & 1)) && (_w & 1))
			if (grid[i].y < cell.y)
				_h++
		if (_h <= h[_w] && grid[i] != cell)
			n.push(i)
	}

	return n
}