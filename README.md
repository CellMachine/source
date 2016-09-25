# CellMachine tutorial
CellMachine is the lightweight JavaScript library for social, biological and robotic simulation.
## Machines
Machine is the world, where simulations happen.
```javascript
var m = new Machine(options)
```
Every Machine must have following options:
- **size**<br>
Pixel width of each cell.
- **width**<br>
Number of cells in x-axis.
- **height**<br>
Number of cells in y-axis.
- **container**<br>
ID of the parent node.
- **colors**<br>
Array of colors in the Machine. You can set each color by name or by hex format.<br>

## Cells
Cell type is the object.
```javascript
var cell = {
  vision: 1,
  process: function(n) {},
  move: function() {
    return false
  }
}
```
- **vision**<br>
The radius of cell neighbourhood.
- **process**<br>
Behavior of the cell. Accept an array of neighbours as an argument. See **rules** for more information.
- **move**<br>
Returns the new coordinates of cell or returns ```false``` if cell stays on its position. See **moving** for more information.

## Rules
In ```process()``` given, how does cell change its states.
For example, rules of [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) are very simple:
```javascript
var s = set(n, { color: 1 }).length
this.color = (s == 3) || (s == 2 && this.color) ? 1 : 0
```
```set(n, options)``` is the global function, whereby you can get subarray of array, each element of which has these options.
You can get random element from any array with ```arr.rand()```. If you want to get several items, use ```arr.rand(n)```, where ```n``` is number of items.

## Moving
Besides states changing, cell can move to certain position.<br>
```return { x: newX, y: newY, instead: { color: 0 },  priority: 1 }```<br>
```x``` and ```y``` are new cell coordinates. If these coordinates don't exist, cell won't move.<br>
In ```instead``` new options of cell are given. Old options of cell reserved, if they are not changed in ```instead```.<br>
If more then one cell are going to go to certain position in one iteration, cell with the most ```priority``` will be selected. If many cells have the same high-priority, one of them will selected randomly.

## Start the simulation
First, add cells into Machine.
```javascript
m.init([
	[water, 0.9, { color: 0 }],
	[grass, 0.1, { color: 1 }]
])
```
Here you should define types, distributions and options. Sum of all distributions must equal to 1.

Then start the simulation with interval in milliseconds.
```javascript
m.start(100)
```
