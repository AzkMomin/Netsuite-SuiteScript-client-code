function createTimesheetRecord()
{
    var record = nlapiLoadRecord('timesheet', 155301);
    record.setFieldValue('customform', 1259);
    var weekofDate = nlapiAddMonths(nlapiDateToString(new Date("01/08/23")));
    record.setFieldValue('trandate', weekofDate);
    record.setFieldValue('employee', 195353);
    var id = nlapiSubmitRecord(record, true);
    log.debug('Time Sheet Save ID : ' , id)
}