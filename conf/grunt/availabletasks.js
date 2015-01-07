/**
 * Display a list of available Grunt tasks on the console.
 */
module.exports = {
    all: {
        options: {
            filter: 'exclude',
            tasks: []
        }
    },
    main: {
        options: {
            filter: 'include',
            tasks: ['availabletasks','compass','compile','serve','test']
        }
    }
};
