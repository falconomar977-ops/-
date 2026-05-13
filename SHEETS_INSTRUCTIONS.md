# دليل ربط نظام الاستعلام بـ Google Sheets

لربط هذا التطبيق بجدول بيانات Google Sheets، يمكنك اتباع طريقتين:

## الطريقة الأولى: باستخدام Google Apps Script (كما طُلِب)

هذه الطريقة تتيح لك تشغيل النظام كـ Web App مستقل داخل بيئة جوجل.

### 1. كود `Code.gs`
قم بإنشاء مشروع جديد في [Google Apps Script](https://script.google.com) وأضف الكود التالي:

```javascript
// استبدل هذا المعرف بمعرف جدول البيانات الخاص بك
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = 'Sheet1';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('نظام استعلام الطلاب')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function searchStudent(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  // نفترض أن العمود الأول هو الاسم (Index 0)
  // البيانات: [الاسم، رقم الجلوس، القاعة، مكان الجلوس، جدول الاختبارات]
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().includes(name)) {
      return {
        name: data[i][0],
        seatNumber: data[i][1],
        hall: data[i][2],
        position: data[i][3],
        exams: JSON.parse(data[i][4]) // نفترض أن الجدول مخزن كـ JSON string
      };
    }
  }
  return null;
}
```

### 2. كود `Index.html` (نسخة مبسطة)
أضف ملف `Index.html` في مشروع Apps Script:

```html
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>استعلام الطلاب</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; background: #f4f7f6; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); display: inline-block; margin-top: 20px; }
        input { padding: 10px; width: 250px; border-radius: 5px; border: 1px solid #ddd; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>نظام استعلام الطلاب</h1>
    <input type="text" id="studentName" placeholder="أدخل اسم الطالب...">
    <button onclick="search()">استعلام</button>
    <div id="result"></div>

    <script>
        function search() {
            var name = document.getElementById('studentName').value;
            google.script.run.withSuccessHandler(showResult).searchStudent(name);
        }
        function showResult(student) {
            if (student) {
                document.getElementById('result').innerHTML = `
                    <div class="card">
                        <h2>${student.name}</h2>
                        <p>رقم الجلوس: ${student.seatNumber}</p>
                        <p>القاعة: ${student.hall}</p>
                    </div>
                `;
            } else {
                alert('الاسم غير موجود');
            }
        }
    </script>
</body>
</html>
```

---

## الطريقة الثانية: الربط المباشر مع هذا التطبيق (AI Studio)

يمكنك تعديل `StudentService.ts` لاستخدام `fetch` مع رابط CSS من Google Sheets إذا كان الجدول "عاماً" (Public):

1. في Google Sheets: `File` > `Share` > `Publish to web`.
2. اختر `Entire Document` ونسخة `CSV`.
3. استخدم الرابط في التطبيق لتحميل البيانات دورياً.

أو استخدم **Google Sheets API** وقم بتفعيل OAuth كما هو موضح في دليل `workspace-integration-gsi`.
