/**
 * @NApiversion 2.0
 * @NScriptType UserEventScript
 */

 define( function () {
    return {
        beforeLoad: function (context) {
            if (context.type == context.UserEventType.EDIT ) { 

                var invoice = context.newRecord;
                var lineCount = invoice.getLineCount({
                    sublistId: 'item'
                })

                var recordData = '';

                // looping records of current invoice
                for (var i = 0; i < lineCount; i++) {
                    var category = invoice.getSublistValue({
                        sublistId: 'ecpcost',
                        fieldId: 'billeddate',
                        line: i
                    })
                    var item = invoice.getSublistText({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    })
                    
                    var amount = invoice.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    })

                    if (!category){
                        var strRec = ''+ ', '+ item + ', ' + amount ;
                        recordData += strRec+'\n';

                    }else{
                        var strRec = category+ ', '+ item + ', ' + amount ;
                        recordData += strRec+'\n';
                    }
                    
                }
               
                invoice.setValue('memo' , recordData)
                invoice.save();
            }

            
        }
    }

});