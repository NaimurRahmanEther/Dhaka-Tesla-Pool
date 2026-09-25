const findShortestPath = (graph, start, destination) => {
  const distances = {};

  const previous = {};

  const visited = new Set();

  Object.keys(graph).forEach((node) => {
    distances[node] = Infinity;
  });

  distances[start] = 0;

  while (true) {
    let currentNode = null;

    let smallestDistance = Infinity;

    for (const node in distances) {
      if (!visited.has(node) && distances[node] < smallestDistance) {
        smallestDistance = distances[node];

        currentNode = node;
      }
    }

    if (currentNode === null) {
      break;
    }

    if (Number(currentNode) === Number(destination)) {
      break;
    }

    visited.add(currentNode);

    const neighbours = graph[currentNode] || [];

    for (const neighbour of neighbours) {
      const newDistance = distances[currentNode] + neighbour.distance;

      if (newDistance < distances[neighbour.node]) {
        distances[neighbour.node] = newDistance;

        previous[neighbour.node] = currentNode;
      }
    }
  }

  const path = [];

  let current = destination;

  while (current !== undefined) {
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
