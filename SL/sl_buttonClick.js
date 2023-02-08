function demoSimpleForm(request, response) {
    if ( request.getMethod() == 'GET' ) {
        var form = nlapiCreateForm('Simple Form');
        form.setScript("customscrip_xyz");
       
        form.addButton('custpage_mybutton','Button','clickMe();');
 
        response.writePage( form );
    }
    else {
        dumpResponse(request,response);
    }
} 