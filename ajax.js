const _aj_ = {
    get(url, params, callback, isOuter) {
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: params,
            success: function (data) {
                console.debug(data);
                callback(data);
            },
            error: function (e) {
                if (e) console.log(e);
            }
        });
    },
    post(url, params, callback, isOuter) {
        $.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify(params),
            success: function (data) {
                console.debug(data);
                callback(data);
            },
            error: function (e) {
                if (e) console.log(e);
            }
        });
    }
};
