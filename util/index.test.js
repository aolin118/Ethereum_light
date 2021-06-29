const {sortCharacters, keccakHash} = require('./index');


describe('utils', () => {
	describe('sortCharacters()', () => {
		it('creats the same string for objects with the same properties in a different order', () => {
			expect(sortCharacters({foo:'foo',bar:'bar'}))
			.toEqual(sortCharacters({bar:'bar',foo:'foo'}));
		});

		it('creats the different string for objects ', () => {
			expect(sortCharacters({foo:'foo'}))
			.not.toEqual(sortCharacters({bar:'bar'}));
		});
	});


	describe('keccakHash()', () => {
		it('employ keccakHash', () => {
			expect(keccakHash({foo:'foo',bar:'bar'}))
			.toEqual('2b6869258eb19ba9f212e1e6366f4480e1672108b0102e92bdb385cfe79d3edd');
		});

		
	});
});