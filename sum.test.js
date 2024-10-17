const add = require('./sum');

test("add 1 and 2 to give 3", ()=>{
    expect(add(1,2)).toBe(3); //add positive numbers
});


test("add -3 and 9 to give 6", ()=>{
    expect(add(-3,-9)).toBe(-12)
})

test("add 1 and 2 to give 3", ()=>{
    expect(add(3,-9)).toBe(-6)
})