
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
189
190
191
192
193
194
195
196
197
198
199
200
201
202
203
204
205
206
207
208
209
210
211
212
213
214
215
216
217
218
219
220
221
222
223
224
225
226
227
228
229
230
231
232
233
234
235
236
237
238
239
240
241
242
243
244
245
246
247
248
249
250
251
  /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
 ||   This script is a tool to help develop SFTP connections      ||
 ||   in Suitescript 2.0                                          ||
 ||                                                               ||
 ||                                                               ||
 ||  Version Date         Author        Remarks                   ||
 ||  1.0     Oct 03 2016  Adolfo Garza  Initial commit            ||
 ||  1.1     Oct 11 2016  Adolfo Garza  Casting Port and Timeout  ||
 ||                                     to Number                 ||
 ||  1.2     Dec 23 2016  Adolfo Garza  Added support for HostKey ||
 ||                                     Port and Type             ||
  \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
 
var HTTPSMODULE, SFTPMODULE, SERVERWIDGETMODULE;
var HOST_KEY_TOOL_URL = 'https://ursuscode.com/tools/sshkeyscan.php?url=';
 
/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */
define(["N/https", "N/sftp", "N/ui/serverWidget"], runSuitelet);
 
//********************** MAIN FUNCTION **********************
function runSuitelet(https, sftp, serverwidget){
    HTTPSMODULE= https;
    SERVERWIDGETMODULE= serverwidget;
    SFTPMODULE= sftp;
    
	var returnObj = {};
	returnObj.onRequest = execute;
	return returnObj;
}
 
function execute(context){
    var method = context.request.method;
    
  	var form = getFormTemplate(method);
    
    if (method == 'GET') {
        form = addSelectorFields(form);
    }
    
    if (method == 'POST') {
        var selectaction = context.request.parameters.selectaction;
        if(selectaction == 'getpasswordguid'){
            form = addPasswordGUID1Fields(form);
            
        }
        else if(selectaction == 'gethostkey'){
            form = addHostKeyFields(form);
        }
        else if(selectaction == 'downloadfile'){
            form = addDownloadFileFields(form);
        } else {
            var password = context.request.parameters.password;
            var username = context.request.parameters.username;
            var passwordGuid = context.request.parameters.passwordguid;
            var url = context.request.parameters.url;
            var hostKey = context.request.parameters.hostkey;
            var hostKeyType = context.request.parameters.hostkeytype;
            var port = context.request.parameters.port;
            var directory = context.request.parameters.directory;
            var timeout = context.request.parameters.timeout;
            var filename = context.request.parameters.filename;
            var restricttoscriptids = context.request.parameters.restricttoscriptids;
            var restricttodomains = context.request.parameters.restricttodomains;
            
            if(restricttoscriptids && restricttodomains){
                form = addPasswordGUID2Fields(form, restricttoscriptids, restricttodomains);
            }
                        
            if(password){
                form.addField({
                    id : 'passwordguidresponse',
                    type : SERVERWIDGETMODULE.FieldType.LONGTEXT,
                    label : 'PasswordGUID Response',
                    displayType: SERVERWIDGETMODULE.FieldDisplayType.INLINE
                }).defaultValue = password;
            }
 
            if(url && passwordGuid && hostKey && filename){
                var sftpConnection = getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, timeout);
                var downloadedFile = sftpConnection.download({
                    filename: filename
                }).getContents();
 
                form.addField({
                    id : 'filecontents',
                    type : SERVERWIDGETMODULE.FieldType.LONGTEXT,
                    label : 'File Contents',
                    displayType: SERVERWIDGETMODULE.FieldDisplayType.INLINE
                }).defaultValue = downloadedFile;
            } else if (url) {
				var myUrl = HOST_KEY_TOOL_URL + url + "&port=" + port + "&type=" + hostKeyType; 
                var theResponse = HTTPSMODULE.get({url: myUrl}).body;
                form.addField({
                    id : 'hostkeyresponse',
                    type : SERVERWIDGETMODULE.FieldType.LONGTEXT,
                    label : 'Host Key Response',
                    displayType: SERVERWIDGETMODULE.FieldDisplayType.INLINE
                }).defaultValue = theResponse;        
            }
        }
    }
    
  	context.response.writePage(form);
  	return;
}
 
function addSelectorFields(form){
    var select = form.addField({
        id: 'selectaction',
        type: SERVERWIDGETMODULE.FieldType.SELECT,
        label: 'Select Action'
    });
    select.addSelectOption({
        value: 'getpasswordguid',
        text: 'Get Password GUID',
    });  
    select.addSelectOption({
        value: 'gethostkey',
        text: 'Get Host Key'
    });  
    select.addSelectOption({
        value: 'downloadfile',
        text: 'Download File'
    });
    return form;
}
 
function addPasswordGUID1Fields(form){
    form.addField({
        id : 'restricttoscriptids',
        type : SERVERWIDGETMODULE.FieldType.TEXT,
        label : 'Restrict To Script Ids',
    }).isMandatory = true;
    form.addField({
        id : 'restricttodomains',
        type : SERVERWIDGETMODULE.FieldType.TEXT,
        label : 'Restrict To Domains',
    }).isMandatory = true;
    
    return form;
}
 
function addPasswordGUID2Fields(form, restrictToScriptIds, restrictToDomains){
    form.addCredentialField({
        id : 'password',
        label : 'Password',
        restrictToScriptIds: restrictToScriptIds.replace(' ', '').split(','),
        restrictToDomains: restrictToDomains.replace(' ', '').split(','),
    });
    return form;
}
 
function addHostKeyFields(form){
    form.addField({
        id : 'url',
        type : SERVERWIDGETMODULE.FieldType.TEXT,
        label : 'URL (Required)',
    });
	
    form.addField({
        id : 'port',
        type : SERVERWIDGETMODULE.FieldType.INTEGER,
        label : 'Port (Optional)',
    });
	
    form.addField({
        id : 'hostkeytype',
        type : SERVERWIDGETMODULE.FieldType.TEXT,
        label : 'Type (Optional)',
    });
    return form;
}
 
function addDownloadFileFields(form){
    form.addField({
        id : 'url',
        type : SERVERWIDGETMODULE.FieldType.TEXT,
        label : 'URL (Required)',
    });
    form.addField({
        id : 'username',
        type : SERVERWIDGETMODULE.FieldType.TEXT,
        label : 'Username',
    });
    form.addField({
        id : 'passwordguid',
        type : SERVERWIDGETMODULE.FieldType.LONGTEXT,
        label : 'PasswordGuid (Required)',
    });
    form.addField({
        id : 'hostkey',
        type : SERVERWIDGETMODULE.FieldType.LONGTEXT,
        label : 'Host Key (Required)',
    });
    form.addField({
        id : 'hostkeytype',
        type : SERVERWIDGETMODULE.FieldType.TEXT,
        label : 'Host Key Type',
    });
    form.addField({
        id : 'filename',
        type : SERVERWIDGETMODULE.FieldType.TEXT,
        label : 'File Name',
    });
    form.addField({
        id : 'port',
        type : SERVERWIDGETMODULE.FieldType.INTEGER,
        label : 'Port',
    });
    form.addField({
        id : 'directory',
        type : SERVERWIDGETMODULE.FieldType.TEXT,
        label : 'Directory',
    });
    form.addField({
        id : 'timeout',
        type : SERVERWIDGETMODULE.FieldType.INTEGER,
        label : 'Timeout',
    });
    return form;
}
 
function getFormTemplate(){
    var form = SERVERWIDGETMODULE.createForm({
        title : 'SFTP Helper Tool'
    });
    form.addSubmitButton({
        label : 'Submit'
    });
    
    return form;
}
 
function getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, timeout){
    var preConnectionObj = {};
    preConnectionObj.passwordGuid = passwordGuid;
    preConnectionObj.url = url;
    preConnectionObj.hostKey = hostKey;
    if(username){ preConnectionObj.username = username; }
    if(hostKeyType){ preConnectionObj.hostKeyType = hostKeyType; }
    if(port){ preConnectionObj.port = Number(port); }
    if(directory){ preConnectionObj.directory = directory; }
    if(timeout){ preConnectionObj.timeout = Number(timeout); }
    
    var connectionObj = SFTPMODULE.createConnection(preConnectionObj);
    return connectionObj;
}