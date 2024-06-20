const asyncHandler = (requestHandler) => {
    (err,req,res,next) =>{
        Promise.resolve(requestHandler(err,req,res,next))
        .catch( (error) =>{
            return next(err);
        })
    }
}

