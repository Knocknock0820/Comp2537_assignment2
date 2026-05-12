//Currently broken because it isn't compatible with express 5
//  it gives an error about the req.query being read-only 
const mongoSanitize = require('express-mongo-sanitize');
app.use((req, res, next) => {
    console.log("req.body: ", req.body);
    console.log("req.query: ", req.query);
    const options = { replaceWith: '_', 
                        onSanitize: (info) => {
                            console.log(`Sanitized ${info.key} in request`);
                        }
                    };
    req.body = mongoSanitize.sanitize(req.body, options);
    req.query = mongoSanitize.sanitize(req.query, options);
    req.params = mongoSanitize.sanitize(req.params, options);
    req.headers = mongoSanitize.sanitize(req.headers, options);
    console.log("req.body: ", req.body);
    console.log("req.query: ", req.query);

    next();
});

app.use(mongoSanitize(
    {replaceWith: '_'}
));
