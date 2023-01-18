/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope public
 */
define(['N/search', 'N/record'],
    function (search, record) {
        function beforeLoad(context) {
            if (context.type != 'create') {
                var newRecord = context.newRecord;
                var newRecordID = context.newRecord.id;

                var name = newRecord.getValue('entitytitle');


                var newFolder = createNewFolder(name);
                log.debug("newFolder : ", newFolder)
                if (newFolder.createFolder) {

                    var ownfolderID = createSubFolder(name)
                    var folderAccessID = createFolderAccessRecord(ownfolderID, newRecordID, newRecord)
                    log.debug("ownfolderID : ", ownfolderID)
                    log.debug("folderAccessID : ", folderAccessID.internalId)

                    var otherId = record.submitFields({
                        type: 'employee',
                        id: newRecordID,
                        values: {
                            'custentity_xperi_folder': ownfolderID,
                            'custentity_folder_access': folderAccessID.internalId,
                        }
                    });
                    log.debug("otherId : ", otherId)
                    if (context.type == 'edit') {
                        if (newRecord.getValue('supervisor')) {
                            if (newRecord.getValue('custentity_folder_access')) {
                                var objFolder = record.load({
                                    type: 'customrecord_dmc_folder_acess',
                                    id: rec.getValue('custentity_folder_access'),
                                    isDynamic: true
                                });
                                objFolder.setValue('custrecord_dmc_folders_employee_acess', newRecord.getValue('supervisor'));
                                objFolder.save();
                            }
                        }
                    }

                } else {
                    var folderAccessID = getFolderAccessId(newFolder.internalId)
                    if (folderAccessID.isEmpty) {
                        log.debug("folderAccessID.isEmpty: ", folderAccessID.isEmpty)
                        var ID = createFolderAccessRecord(newFolder.internalId, newRecordID, newRecord);
                        log.debug("ID ", ID)
                        folderAccessID = ID
                    }
                    // log.debug("newFolder.internalId : ", newFolder.internalId)
                    log.debug("folderAccessID: obj ", folderAccessID)
                    log.debug("folderAccessID.internalId : ", folderAccessID.internalId)
                    var otherId = record.submitFields({
                        type: 'employee',
                        id: newRecordID,
                        values: {
                            'custentity_xperi_folder': newFolder.internalId,
                            'custentity_folder_access': parseInt(folderAccessID.internalId),
                        }
                    });
                    log.debug("otherId : ", otherId)
                    if (context.type == 'edit') {
                        if (newRecord.getValue('supervisor')) {
                            if (newRecord.getValue('custentity_folder_access')) {
                                var objFolder = record.load({
                                    type: 'customrecord_dmc_folder_acess',
                                    id: rec.getValue('custentity_folder_access'),
                                    isDynamic: true
                                });
                                objFolder.setValue('custrecord_dmc_folders_employee_acess', newRecord.getValue('supervisor'));
                                objFolder.save();
                            }
                        }
                    }
                }

            }

        }
        function afterSubmit(context) {
            var newRecordID = context.newRecord.id;

            var newRecord = record.load({
                type: "employee",
                id: newRecordID,
                isDynamic: true
            })
            var name = newRecord.getValue('entitytitle');
            log.debug("name : ", name)
            log.debug("newRecordID : ", newRecordID)
            var folderAccess = newRecord.getValue('custentity_folder_access');
            var ownFolder = newRecord.getValue('custentity_xperi_folder');
            if (folderAccess == "" || ownFolder == "") {
                var ownfolderID = createSubFolder(name)
                var searchId = createEmpSearch(ownfolderID, name,newRecordID);
                var groupRecord = createGroupRecord(name, searchId, ownfolderID, newRecordID)
                var folderAccessID = createFolderAccessRecord(ownfolderID, newRecordID, newRecord)
                log.debug("ownfolderID : ", ownfolderID)
                log.debug("folderAccessID : ", folderAccessID.internalId)

                var otherId = record.submitFields({
                    type: 'employee',
                    id: newRecordID,
                    values: {
                        'custentity_xperi_folder': ownfolderID,
                        'custentity_folder_access': parseInt(folderAccessID.internalId)
                    }
                });
                log.debug("otherId : ", otherId)

            }

        }

        function createNewFolder(folderName) {
            let returnObj;
            const folderSearchColInternalId = search.createColumn({ name: 'internalid' });
            const folderSearchColSubOf = search.createColumn({ name: 'parent' });
            const folderSearch = search.create({
                type: 'folder',
                filters: [
                    ['name', 'contains', folderName],
                    'AND',
                    ['parent', 'anyof', '1228'],
                ],
                columns: [
                    folderSearchColInternalId,
                    folderSearchColSubOf,
                ],
            });

            const folderSearchPagedData = folderSearch.runPaged({ pageSize: 1000 });

            if (folderSearchPagedData.pageRanges.length != 0) {
                for (let i = 0; i < folderSearchPagedData.pageRanges.length; i++) {
                    const folderSearchPage = folderSearchPagedData.fetch({ index: i });
                    folderSearchPage.data.forEach((result) => {
                        const internalId = result.getValue(folderSearchColInternalId);
                        const subOf = result.getValue(folderSearchColSubOf);
                        log.debug("internalId :  : ", internalId)
                        returnObj = {
                            "createFolder": false,
                            "internalId": internalId,
                            "subof": subOf
                        }
                    });
                }
            } else {
                returnObj = { "createFolder": true }
            }
            return returnObj
        }

        function createSubFolder(name) {
            var objRecord = record.create({
                type: record.Type.FOLDER,
                isDynamic: true
            });
            log.debug('name', name)
            objRecord.setValue({
                fieldId: 'name',
                value: name
            });
            objRecord.setValue({
                fieldId: 'parent',
                value: 1228
            });
            var folderId = objRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            return folderId
        }

        function createFolderAccessRecord(folderId, newRecordID, rec) {
            var folderAccessRecord = record.create({
                type: 'customrecord_dmc_folder_acess',
                isDynamic: true
            });
            if (rec.getValue('supervisor')) {
                folderAccessRecord.setValue('custrecord_dmc_folders_employee_acess', rec.getValue('supervisor'));
                log.debug("supervisor : ", rec.getValue('supervisor'))
            }
            folderAccessRecord.setValue('custrecord_dmc_folder_employee_owner', newRecordID);
            folderAccessRecord.setValue('custrecord_dmc_folder_id_access', folderId);
            var folderAccessRecordID = folderAccessRecord.save();
            log.debug("folderAccessRecordID : ", folderAccessRecordID)
            return { 'internalId': folderAccessRecordID }
        }

        function getFolderAccessId(newFolderinternalId) {
            let objectReturn;
            const customrecord_dmc_folder_acessSearchColInternalId = search.createColumn({ name: 'internalid' });
            const customrecord_dmc_folder_acessSearchColFolderId = search.createColumn({ name: 'custrecord_dmc_folder_id_access' });
            const customrecord_dmc_folder_acessSearch = search.create({
                type: 'customrecord_dmc_folder_acess',
                filters: [
                    ['custrecord_dmc_folder_id_access', 'equalto', String(newFolderinternalId)],
                ],
                columns: [
                    customrecord_dmc_folder_acessSearchColInternalId,
                    customrecord_dmc_folder_acessSearchColFolderId,
                ],
            });
            const customrecord_dmc_folder_acessSearchPagedData = customrecord_dmc_folder_acessSearch.runPaged({ pageSize: 1000 });
            if (customrecord_dmc_folder_acessSearchPagedData.pageRanges.length != 0) {
                for (let i = 0; i < customrecord_dmc_folder_acessSearchPagedData.pageRanges.length; i++) {
                    const customrecord_dmc_folder_acessSearchPage = customrecord_dmc_folder_acessSearchPagedData.fetch({ index: i });
                    customrecord_dmc_folder_acessSearchPage.data.forEach((result) => {
                        const internalId = result.getValue(customrecord_dmc_folder_acessSearchColInternalId);
                        const folderId = result.getValue(customrecord_dmc_folder_acessSearchColFolderId);
                        objectReturn = { "internalId": internalId, "isEmpty": false };
                    });
                }
            } else {
                objectReturn = { "isEmpty": true }
            }
            return objectReturn;
        }

        function createEmpSearch(ownfolderID, name,newRecordID) {
            var employeeSearchObj = search.create({
                type: "employee",
                title: 'Folder Access ' + name,
                id: 'customsearch_folder_access_' + newRecordID,
                isPublic: true,
                filters:
                    [
                        ["role", "anyof", "1035", "1055", "1045"],
                        "OR",
                        ["custentity_xperi_folder", "equalto", ownfolderID],
                        "OR",
                        ["custrecord_dmc_folders_employee_acess.custrecord_dmc_folder_id_access", "equalto", ownfolderID]
                    ],
                columns:
                    [
                        search.createColumn({ name: "entityid", sort: search.Sort.ASC, label: "ID" }),
                        search.createColumn({ name: "altname", label: "Name" }),
                        search.createColumn({ name: "email", label: "Email" }),
                        search.createColumn({ name: "phone", label: "Phone" }),
                        search.createColumn({ name: "altphone", label: "Office Phone" }),
                        search.createColumn({ name: "fax", label: "Fax" }),
                        search.createColumn({ name: "supervisor", label: "Supervisor" }),
                        search.createColumn({ name: "title", label: "Job Title" }),
                        search.createColumn({ name: "altemail", label: "Alt. Email" }),
                        search.createColumn({ name: "custentity_xperi_fp_a_approver", label: "FP&A Approver" }),
                        search.createColumn({ name: "custentity_xperi_folder", label: "Own Folder" })
                    ]
            });
            var idSearch = employeeSearchObj.save();
            return idSearch
        }
        function createGroupRecord(name, idSearch, folderId, newRecordID) {
            var groupRec = record.create({
                type: 'entitygroup',
                defaultValues: {
                    dynamic: 'T',
                    grouptype: 'Employee',
                    recordmode: 'dynamic'
                }
            });
            groupRec.setValue({
                fieldId: 'groupname',
                value: 'Group Employee ' + name
            });
            groupRec.setValue({
                fieldId: 'savedsearch',
                value: idSearch
            });
            groupRec.setValue({
                fieldId: 'groupowner',
                value: newRecordID
            });
            var groupid = groupRec.save();
            log.debug("Group Id : " , groupid)
            var folderSavedRecId = record.submitFields({
                type: 'folder',
                id: folderId,
                values: {
                    'group': groupid
                }
            });
            log.debug("Save Folder Record Id : " , folderSavedRecId)
        }
        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        };
    });