const findShortestPath = (graph, start, destination) => {
  const distances = {};

  const previous = {};

  const visited = new Set();

  // Initial distance

  Object.keys(graph).forEach((node) => {
    distances[node] = Infinity;
  });

  distances[start] = 0;

  while (true) {
    let currentNode = null;

    let smallestDistance = Infinity;

    // Find nearest unvisited node

    for (const node in distances) {
      if (!visited.has(node) && distances[node] < smallestDistance) {
        smallestDistance = distances[node];

        currentNode = node;
      }
    }

    // No path exists

    if (currentNode === null) {
      break;
    }

    // Destination reached

    if (Number(currentNode) === Number(destination)) {
      break;
    }

    visited.add(currentNode);

    // Update neighbours

    for (const neighbour of graph[currentNode]) {
      const newDistance = distances[currentNode] + neighbour.distance;

      if (newDistance < distances[neighbour.node]) {
        distances[neighbour.node] = newDistance;

        previous[neighbour.node] = currentNode;
      }
    }
  }

  // Build route

  const path = [];

  let current = destination;

  while (current) {
    path.unshift(Number(current));

    current = previous[current];
  }

  if (path[0] !== Number(start)) {
    return null;
  }

  return {
    distance: distances[destination],

    path,
  };
};

module.exports = {
  findShortestPath,
};
