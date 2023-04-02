const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var todysDate = new Date();
var month = todysDate.getMonth() + 1;



// Format date

const getSurplusPointExpireDate = (fdate) => {
    const date = fdate;

    // newDate.setMonth(date.getMonth() + 3)
    const yyyy = date.getFullYear();
    let mm = date.getMonth() + 1 + 3; // Months start at 0!
    let dd = date.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    const formattedDate = mm + '/' + dd + '/' + yyyy;
    log.debug("newDate : ", new Date(formattedDate));

    return new Date(formattedDate)
}

// Set formated Date

var format_date = format.parse({
    value: startDate,
    type: format.Type.DATE
})


// lookup field

var fieldLookUp = search.lookupFields({
    type: search.Type.SALES_ORDER,
    id: '87',
    columns: ['entity', 'subsidiary', 'name', 'currency']
});
//Line count
var lineCount = record.getLineCount({sublistId : ""})
// setting sublist value in dynamic record

//Select new line
rec.selectNewLine("item");
//setting sublist value
rec.selectLine("item", i);
rec.setCurrentSelectValue("item", "item", "123");
rec.setCurrentSelectValue("item", "quantity", 5);
rec.setCurrentSelectValue("item", "quantity");
rec.commitLine("item");


//Setting body field without loading record

var otherId = record.submitFields({
    type: 'customrecord_book',
    id: '4',
    values: {
        'custrecord_rating': '2'
    }
});
