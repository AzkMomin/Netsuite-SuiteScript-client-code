/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record', "N/format", "N/file"
], function (search, record, format, file) {

    function getInputData() {
        var folderSearchColName = search.createColumn({ name: 'name', sort: search.Sort.ASC });
        var folderSearchColSizeKb = search.createColumn({ name: 'foldersize' });
        var folderSearchColLastModified = search.createColumn({ name: 'lastmodifieddate' });
        var folderSearchColSubOf = search.createColumn({ name: 'parent' });
        var folderSearchColOfFiles = search.createColumn({ name: 'numfiles' });
        var folderSearchColInternalId = search.createColumn({ name: 'internalid', join: 'file' });
        var folderSearch = search.create({
            type: 'folder',
            filters: [
                ['internalid', 'anyof', '3005'],
            ],
            columns: [
                folderSearchColName,
                folderSearchColSizeKb,
                folderSearchColLastModified,
                folderSearchColSubOf,
                folderSearchColOfFiles,
                folderSearchColInternalId,
            ],
        });
        return folderSearch;
    }

    function map(context) {
        var searchResult = JSON.parse(context.value);
        // log.debug('searchResult : ', searchResult);
        try {
            var fileId = searchResult.values["internalid.file"].value;
            log.debug('fileId : ', fileId);
            var fileObj = file.load({
                id: fileId
            });

            var rec = [];

            var iterator = fileObj.lines.iterator();
            //Skip the first line (CSV header)
            iterator.each(() => { return false; });
            var i = 0;
            iterator.each((line) => {
                var lineValues = line.value.split(",");
                rec.push({
                    "customForm": lineValues[0],
                    "weekof": lineValues[1],
                    "date": lineValues[2],
                    "employee": lineValues[3],
                    "customerProject": lineValues[4],
                    "caseTestEvent": lineValues[5],
                    "department": lineValues[6],
                    "location": lineValues[7],
                    "activityCode": lineValues[8],
                    "visionx": lineValues[9],
                    "hours": lineValues[10],
                    "line": i
                });
                i++;
                return true;
            });
            // log.debug('Record Data : ', rec);

            createRecord(rec)
            //Move the file from CSV Files For Processing to CSV Files Processed
            fileObj.folder = 3007
            var fileid = fileObj.save();
        }

        catch (e) {
            log.debug('e : ', e);
        }

    }

    function createRecord(rec) {
        // log.debug('Record Data: ', rec);
        var timeSheetRec = record.create({
            type: 'timesheet',
            isDynamic: true
        })
        var myDateString = rec[0].weekof
        log.debug("myDateString : ", myDateString);
        var parseDate = format.parse({
            value: myDateString,
            type: format.Type.DATE
        });
        log.debug("parseDate : ", parseDate);
        log.debug("myDateString obj: ", new Date(myDateString));

        var employee = rec[0].employee
        var project = rec[0].customerProject
        var empId = getEmpId(employee);
        var projectId = getProjectId(project);

        log.debug("empId : ", empId);
        log.debug("projectId : ", projectId);

        timeSheetRec.setValue({ fieldId: 'customform', value: rec[0].customForm })
        timeSheetRec.setValue({ fieldId: 'trandate', value: parseDate })
        timeSheetRec.setValue({ fieldId: 'employee', value: empId })

        var location = getlocation(rec[0].location)
        var department = getdepartment(rec[0].department)
        var activityCode = getactivityCode(rec[0].activityCode)
        // var visionx = getvisionx(rec[0].visionx)
        log.debug("location : ", location);
        log.debug("department : ", department);
        log.debug("activityCode : ", activityCode);
        // log.debug("visionx : ", visionx);


        var hrs = getHours(rec)
        log.debug("hrs : ", hrs);
        var i = 0;
        Object.keys(hrs).forEach(key => {
            timeSheetRec.selectNewLine({ sublistId: 'timeitem' });
            timeSheetRec.setCurrentSublistValue({ sublistId: 'timeitem', fieldId: "customer", value: projectId })
            timeSheetRec.setCurrentSublistValue({ sublistId: 'timeitem', fieldId: key, value: hrs[key] })
            timeSheetRec.setCurrentSublistValue({ sublistId: 'timeitem', fieldId: "location", value: location })
            // timeSheetRec.setCurrentSublistValue({ sublistId: 'timeitem', fieldId: "department", value: department })
            timeSheetRec.setCurrentSublistValue({ sublistId: 'timeitem', fieldId: "cseg_paactivitycode", value: activityCode })
            // timeSheetRec.setCurrentSublistValue({ sublistId: 'timeitem', fieldId: "cseg_paactivitycode_2", value: visionx })
            timeSheetRec.commitLine({ sublistId: 'timeitem' });
            i++
        });


        var timeSheetSavedRec = timeSheetRec.save();
        log.debug('time Sheet Saved Record : ', timeSheetSavedRec);
    }
    function getlocation(location) {
        var locationId;
        const locationSearchColInternalId = search.createColumn({ name: 'internalid' });
        const locationSearchColName = search.createColumn({ name: 'name', sort: search.Sort.ASC });
        const locationSearch = search.create({
            type: 'location',
            filters: [
                ['name', 'contains', location],
            ],
            columns: [
                locationSearchColInternalId,
                locationSearchColName,
            ],
        });

        const locationSearchPagedData = locationSearch.runPaged({ pageSize: 1000 });
        for (let i = 0; i < locationSearchPagedData.pageRanges.length; i++) {
            const locationSearchPage = locationSearchPagedData.fetch({ index: i });
            locationSearchPage.data.forEach((result) => {
                const internalId = result.getValue(locationSearchColInternalId);
                const name = result.getValue(locationSearchColName);

                locationId = internalId;
            });
        }
        return locationId
    }

    function getvisionx(visionx) {

    }
    function getdepartment(dept) {
        var departmentId;
        const departmentSearchColName = search.createColumn({ name: 'name', sort: search.Sort.ASC });
        const departmentSearchColInternalId = search.createColumn({ name: 'internalid' });
        const departmentSearch = search.create({
            type: 'department',
            filters: [
                ['name', 'is', dept],
            ],
            columns: [
                departmentSearchColName,
                departmentSearchColInternalId,
            ],
        });

        const departmentSearchPagedData = departmentSearch.runPaged({ pageSize: 1000 });
        for (let i = 0; i < departmentSearchPagedData.pageRanges.length; i++) {
            const departmentSearchPage = departmentSearchPagedData.fetch({ index: i });
            departmentSearchPage.data.forEach((result) => {
                const name = result.getValue(departmentSearchColName);
                const internalId = result.getValue(departmentSearchColInternalId);
                departmentId = internalId;
            });
        }
        return departmentId
    }
    function getactivityCode(activity) {

        var activityId;
        if (activity == "Labour" || activity == "LABOUR") {
            activityId = 1
        }
        else if (activity == "Material" || activity == "MATERIAL") {
            activityId = 2
        }
        else if (activity == "Contingency" || activity == "CONTINGENCY") {
            activityId = 3
        }
        else if (activity == "Subcontractors" || activity == "SUBCONTRACTORS") {
            activityId = 4
        }
        else if (activity == "Claim" || activity == "CLAIM") {
            activityId = 5
        }
        return activityId
    }

    function getEmpId(employee) {
        let id;
        const employeeSearchColInternalId = search.createColumn({ name: 'internalid' });
        const employeeSearchColName = search.createColumn({ name: 'entityid', sort: search.Sort.ASC });
        const employeeSearch = search.create({
            type: 'employee',
            filters: [
                ['entityid', 'is', employee],
            ],
            columns: [
                employeeSearchColInternalId,
                employeeSearchColName,
            ],
        });

        const employeeSearchPagedData = employeeSearch.runPaged({ pageSize: 1000 });
        for (let i = 0; i < employeeSearchPagedData.pageRanges.length; i++) {
            const employeeSearchPage = employeeSearchPagedData.fetch({ index: i });
            employeeSearchPage.data.forEach((result) => {
                const internalId = result.getValue(employeeSearchColInternalId);
                const name = result.getValue(employeeSearchColName);
                id = internalId
            });
        }
        return id
    }

    function getProjectId(project) {
        let id;
        const jobSearchColInternalId = search.createColumn({ name: 'internalid' });
        const jobSearchColName = search.createColumn({ name: 'altname' });
        const jobSearch = search.create({
            type: 'job',
            filters: [
                ['entityid', 'is', project],
            ],
            columns: [
                jobSearchColInternalId,
                jobSearchColName,
            ],
        });

        const jobSearchPagedData = jobSearch.runPaged({ pageSize: 1000 });
        for (let i = 0; i < jobSearchPagedData.pageRanges.length; i++) {
            const jobSearchPage = jobSearchPagedData.fetch({ index: i });
            jobSearchPage.data.forEach((result) => {
                const internalId = result.getValue(jobSearchColInternalId);
                const name = result.getValue(jobSearchColName);
                id = internalId
            });
        }
        return id
    }

    function getHours(rec) {
        let dateHours = {}
        const date1 = new Date(rec[0].weekof);
        rec.forEach(element => {
            const date2 = new Date(element.date);
            const diffTime = Math.abs(date2 - date1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays == 1) {
                dateHours.hours1 = element.hours
            }
            else if (diffDays == 2) {
                dateHours.hours2 = element.hours
            }
            else if (diffDays == 3) {
                dateHours.hours3 = element.hours
            }
            else if (diffDays == 4) {
                dateHours.hours4 = element.hours
            }
            else if (diffDays == 5) {
                dateHours.hours5 = element.hours
            }
            else if (diffDays == 6) {
                dateHours.hours6 = element.hours
            }

        });

        return dateHours;
    }
    return {
        getInputData: getInputData,
        map: map
    }

});
