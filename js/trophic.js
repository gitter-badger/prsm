/*
translation of the Trophic Levels algorithm to javascript

NG 18 December 2020

*/

/* simple minded adjacency matric manipulation functions.
 * They generally assume that the matrix is square (no checks are done
 * that they are).
 * Assumes all weights are unity (TODO: allow weighted edges)
 * Matrix data structure is just an array of arrays
 */

/**
 * convert a directed adjacency matrix to an undirected one
 * mirror the elements above the leading diagonal to below it
 * @param {square matrix} a
 * @returns {matrix} a copy of a
 */
function undirected(a) {
	let b = Array(a.length);
	for (let i = 0; i < a.length; i++) {
		b[i] = new Array(a.length);
		b[i][i] = a[i][i];
	}
	for (let i = 0; i < a.length; i++) {
		for (let j = i + 1; j < a.length; j++) {
			if (a[i][j] || a[j][i]) {
				b[i][j] = 1;
				b[j][i] = 1;
			} else {
				b[i][j] = 0;
				b[j][i] = 0;
			}
		}
	}
	return b;
}
/**
 * check that all nodes are connected to at least one other node
 * i.e. every row includes at least one 1
 * @param {square matrix} a
 */
function connected(a) {
	for (let i = 0; i < a.length; i++) {
		let nonzero = false;
		for (let j = 0; j < a.length; j++) {
			if (a[i][j] !== 0) {
				nonzero = true;
				break;
			}
		}
		if (!nonzero) return false;
	}
	return true;
}
/**
 * swap cell values across the leading diagonal
 * @param {matrix} a
 * @returns {matrix} a transposed copy of a
 */
function transpose(a) {
	let b = new Array(a.length);
	for (let i = 0; i < a.length; i++) {
		b[i] = new Array(a.length);
		for (let j = 0; j < a.length; j++) b[i][j] = a[j][i];
	}
	return b;
}
/**
 * return a vector of the number of edges out of a node
 * @param {matrix} a
 * @returns {vector}
 */
function out_degree(a) {
	let v = new Array(a.length);
	for (let row = 0; row < a.length; row++) v[row] = sumVec(a[row]);
	return v;
}
/**
 * return a vector of the number of edges into a node
 * @param {matrix} a
 * @returns {vector}
 */
function in_degree(a) {
	return out_degree(transpose(a));
}
/**
 * returns the summation of the values in the vector
 * @param {vector} v
 * @returns {integer}
 */
function sumVec(v) {
	let sum = 0;
	for (let i = 0; i < v.length; i++) sum += v[i];
	return sum;
}
/**
 * v1 - v2
 * @param {vector} v1
 * @param {vector} v2
 * @returns {vector}
 */
function subVec(v1, v2) {
	let res = new Array(v1.length);
	for (let i = 0; i < v1.length; i++) res[i] = v1[i] - v2[i];
	return res;
}
/**
 * v1 + v2
 * @param {vector} v1
 * @param {vector} v2
 * @returns {vector}
 */
function addVec(v1, v2) {
	let res = new Array(v1.length);
	for (let i = 0; i < v1.length; i++) res[i] = v1[i] + v2[i];
	return res;
}
/**
 * subtract matrix b from a
 * @param {matrix} a
 * @param {matrix} b
 */
function subtract(a, b) {
	let c = new Array(a.length);
	for (let i = 0; i < a.length; i++) {
		c[i] = subVec(a[i], b[i]);
	}
	return c;
}
/**
 * Add matrix a to its transpose, but normalise the cell values resulting to 0/1
 * @param {matrix} a
 * @returns {matrix} a copy of the result
 */
function mergeTranspose(a) {
	let b = transpose(a);
	for (let i = 0; i < a.length; i++) {
		for (let j = 0; j < a.length; j++) if (a[i][j] > 0) b[i][j] = 1;
	}
	return b;
}
/**
 * create a new square matrix of size n, with all cells zero
 * @param {matrix} a
 */
function zero(n) {
	let b = new Array(n);
	for (let i = 0; i < n; i++) {
		b[i] = new Array(n);
		for (let j = 0; j < n; j++) {
			b[i][j] = 0;
		}
	}
	return b;
}
/**
 * create a zero matrix with v as the leading diagonal
 * @param {vector} v
 * @returns {matrix}
 */
function diag(v) {
	let b = zero(v.length);
	for (let i = 0; i < v.length; i++) {
		b[i][i] = v[i];
	}
	return b;
}
/**
 * subtract the minimum value of any cell from each cell of the vector
 * @param {vector} v
 */
function rebase(v) {
	let min = Math.min(...v);
	let res = new Array(v.length);
	for (let i = 0; i < v.length; i++) res[i] = v[i] - min;
	return res;
}
/**
 * solve Ax=B by Gauss-Jordan elimination method
 * adapted from https://www.npmjs.com/package/linear-equation-system
 * @param {matrix} A
 * @param {vector} B
 */
function solve(A, B) {
	let system = A.slice();
	for (let i = 0; i < B.length; i++) system[i].push(B[i]);

	for (let i = 0; i < system.length; i++) {
		let pivotRow = findPivotRow(system, i);
		if (!pivotRow) return false; //Singular system
		if (pivotRow != i) system = swapRows(system, i, pivotRow);
		let pivot = system[i][i];
		for (let j = i; j < system[i].length; j++) {
			//divide row by pivot
			system[i][j] = system[i][j] / pivot;
		}
		for (let j = i + 1; j < system.length; j++) {
			// Cancel below pivot
			if (system[j][i] != 0) {
				let operable = system[j][i];
				for (let k = i; k < system[i].length; k++) {
					system[j][k] -= operable * system[i][k];
				}
			}
		}
	}
	for (let i = system.length - 1; i > 0; i--) {
		// Back substitution
		for (let j = i - 1; j >= 0; j--) {
			if (system[j][i] != 0) {
				let operable = system[j][i];
				for (let k = j; k < system[j].length; k++) {
					system[j][k] -= operable * system[i][k];
				}
			}
		}
	}
	let answer = [];
	for (let i = 0; i < system.length; i++) {
		answer.push(system[i].pop());
	}
	return answer;

	function findPivotRow(sys, index) {
		let row = index;
		for (let i = index; i < sys.length; i++)
			if (Math.abs(sys[i][index]) > Math.abs(sys[row][index])) row = i;
		if (sys[row][index] == 0) return false;
		return row;
	}

	function swapRows(sys, row1, row2) {
		let cache = sys[row1];
		sys[row1] = sys[row2];
		sys[row2] = cache;
		return sys;
	}
}
/**
 * Round the cell values of v to the given number of decimal places
 * @param {vector} v
 * @param {integer} places
 */
function round(v, places) {
	for (let i = 0; i < v.length; i++) v[i] = v[i].toFixed(places);
	return v;
}

/* --------------------------------------------------------------------*/
/**
 * This is the Trophic Levels Algorithm
 *
 * @param {matrix} a square adjacency matrix
 * @returns {vector} levels (heights)
 */
function get_trophic_levels(a) {
	// get undirected matrix
	let au = undirected(a);
	// check connected
	if (connected(au)) {
		// get in degree vector
		let in_deg = in_degree(a);
		// get out degree vector
		let out_deg = out_degree(a);
		// get in - out
		let v = subVec(in_deg, out_deg);
		// get diagonal matrix, subtract (adj. matrix plus its transpose)
		let L = subtract(diag(addVec(in_deg, out_deg)), mergeTranspose(a));
		// set (0,0) to zero
		L[0][0] = 0;
		// do linear solve
		let h = solve(L, v);
		if (!h) {
			console.log('Singular matrix');
			return null;
		}
		// base to zero
		h = rebase(h);
		// round to 3 decimal places
		h = round(h, 3);
		// return tropic heights
		return h;
	} else {
		console.log('Network must be weakly connected');
		return null;
	}
}
/**
 * convert a vector of objects, each an edge referencing from and to nodes
 * to an adjacency matrix
 * @param {vector} v
 * @returns matrix
 */
function edgeListToAdjMatrix(v) {
	let nodes = new Array();
	for (let i = 0; i < v.length; i++) {
		if (nodes.indexOf(v[i].from) == -1) nodes.push(v[i].from);
		if (nodes.indexOf(v[i].to) == -1) nodes.push(v[i].to);
	}
	let a = zero(nodes.length);
	for (let i = 0; i < v.length; i++) {
		a[nodes.indexOf(v[i].from)][nodes.indexOf(v[i].to)] = 1;
	}
	return a;
}

export function trophic(data) {
    // get a list of all edges as pairs of to and from nodes
    let edges = data.edges.get();
    // save min and max x coordinates of nodes
     // convert to an adjacency matrix
    let adj = edgeListToAdjMatrix(edges);
    // get trophic levels
    let levels = get_trophic_levels(adj);
    // rescale levels to match original max and min
    let minX = Math.min(...data.nodes.map((n) => n.x));
    let maxX = Math.max(...data.nodes.map((n) => n.x));
    let scale = (maxX - minX) / (Math.max(...levels) - Math.min(...levels));
    for (let i = 0; i < levels.length; i++) {
        levels[i] = levels[i] * scale + minX
    }
    // get a list of nodes in the adjacency matrix order
    let nodeIds = new Array();
    for (let i = 0; i < edges.length; i++) {
		if (nodeIds.indexOf(edges[i].from) == -1) nodeIds.push(edges[i].from);
		if (nodeIds.indexOf(edges[i].to) == -1) nodeIds.push(edges[i].to);
	}
    // move nodes to new positions
    let nodes = new Array;
    for (let i = 0; i < nodeIds.length; i++) {
        let node = data.nodes.get(nodeIds[i]);
        node.x = levels[i];
        nodes.push(node);
    }
    return nodes;
}