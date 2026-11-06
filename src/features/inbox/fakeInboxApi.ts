// In this mock, we simply return complex data similar to
// what a real API would give for the inbox. Replace with a real
// fetch when the backend is ready.
export async function fakeInboxApi() {
  return {
    assigned: [{ id: 1, title: "Caso A" }, { id: 2, title: "Caso B" }],
    awaiting: [{ id: 3, title: "Revisao X" }],
    review: [{ id: 4, title: "Processo Y" }],
    newItems: [],
  };
}
