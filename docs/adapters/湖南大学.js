/**
 * 湖南大学适配器 (HNU Adapter)
 * 别名: HNU
 * 贡献者: AntiGravity
 */
(function () {
    class HNUAdapter {
        static async convert(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        if (!window.XLSX) return reject(new Error("XLSX lib not found"));
                        const data = new Uint8Array(e.target.result);
                        const workbook = window.XLSX.read(data, { type: 'array' });
                        const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
                        resolve(this.parse(rows));
                    } catch (err) { reject(err); }
                };
                reader.readAsArrayBuffer(file);
            });
        }

        static parse(rows) {
            let output = [];
            const weekMap = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

            const cleanLocation = (raw) => {
                if (!raw) return "Unknown";
                let loc = raw.trim();

                // 1. 体育场地等 【...】
                const bracketMatch = loc.match(/【(.*?)】/);
                if (bracketMatch) {
                    let name = bracketMatch[1].trim();
                    let simplified = name.replace(/(?:网球|羽毛球|篮球|足球|排球|乒乓球|田径|游泳)?(?:运动)?(?:场地|球场|场|馆)$/, '');
                    return simplified || name;
                }

                // 2. 楼栋教室 (简称) 格式，如 "综合教学楼(综409)" -> "综409", "中楼(中410)" -> "中410"
                const parenMatch = loc.match(/[\(（]([^()（）]+)[\)）]/);
                if (parenMatch) {
                    return parenMatch[1].trim();
                }

                // 3. 如果本身包含场地后缀且类似体育场地，如 "荫马塘网球场"
                if (/网球|羽毛球|篮球|足球|排球|乒乓球|田径|运动场/.test(loc)) {
                    let simplified = loc.replace(/(?:网球|羽毛球|篮球|足球|排球|乒乓球|田径|游泳)?(?:运动)?(?:场地|球场|场|馆)$/, '');
                    if (simplified) return simplified;
                }

                // 4. 去除首尾可能的括号标点并返回
                loc = loc.replace(/^[(\[（【]+|[)\]）】]+$/g, '').trim();
                return loc || "Unknown";
            };

            const cleanTeacher = (raw) => {
                if (!raw) return "Unknown";
                // 移除高校常见职称与括号说明
                return raw
                    .replace(/[\(（][^()（）]*(?:教授|讲师|导师|研究员|助教)[^()（）]*[\)）]/g, '')
                    .replace(/副?教授|讲师|助理教授|博士生导师|硕士生导师|研究员|副研究员|助教/g, '')
                    .trim();
            };

            const sectionMap = {
                '一': '01~02', '1': '01~02',
                '二': '03~04', '2': '03~04',
                '三': '05~06', '3': '05~06',
                '四': '07~08', '4': '07~08',
                '五': '09~10', '5': '09~10',
                '六': '11~12', '6': '11~12',
            };

            for (let r = 0; r < rows.length; r++) {
                const row = rows[r];
                if (!row || !row[0]) continue;
                const firstCell = row[0];

                if (typeof firstCell === 'string' && firstCell.includes("大节")) {
                    let numChar = firstCell.split('\n')[0].replace(/[第大节]/g, '');
                    if (output.length > 0) output.push("");
                    output.push(`第${numChar.repeat(10)}大节`);

                    let timeStr = sectionMap[numChar] ? `${sectionMap[numChar]}小节` : "01~02小节";

                    for (let c = 1; c <= 7; c++) {
                        if (!row[c]) continue;
                        let lines = row[c].split('\n').map(l => l.trim()).filter(l => l && l !== 'null');

                        for (let i = 0; i < lines.length; i++) {
                            let line = lines[i];
                            // 寻找包含教师和周数的信息行（包含中英文分号与周）
                            if (/[;；]/.test(line) && line.includes('周')) {
                                let name = (i > 0) ? lines[i - 1] : "未知课程";
                                let extra = "";
                                if (i + 1 < lines.length && (lines[i + 1].startsWith('[') || lines[i + 1].includes('【'))) {
                                    extra = lines[i + 1];
                                    i++;
                                }

                                let cleanInfo = line.replace(/；/g, ';');
                                let firstSemi = cleanInfo.indexOf(';');
                                let teacherRaw = cleanInfo.slice(0, firstSemi).trim();
                                let rest = cleanInfo.slice(firstSemi + 1).trim();

                                let weeks = "";
                                let locRaw = "";

                                const weekMatch = rest.match(/^\[?([\d\s,\-~、]+周(?:\s*[\(（\[【]?[单双][\)）\]】]?)?)\]?/);
                                if (weekMatch) {
                                    weeks = weekMatch[1].replace(/\s+/g, '');
                                    locRaw = rest.slice(weekMatch[0].length).replace(/^[;；\s]+/, '').trim();
                                } else {
                                    const fallbackMatch = rest.match(/\[?([\d\s,\-~、]+周(?:\s*[\(（\[【]?[单双][\)）\]】]?)?)\]?/);
                                    if (fallbackMatch) {
                                        weeks = fallbackMatch[1].replace(/\s+/g, '');
                                        locRaw = rest.replace(fallbackMatch[0], '').replace(/^[;；\s]+/, '').trim();
                                    } else {
                                        weeks = rest;
                                    }
                                }

                                if (!locRaw && extra) {
                                    locRaw = extra;
                                }

                                const lastLine = output[output.length - 1];
                                if (lastLine && !lastLine.includes("大节")) {
                                    output.push("");
                                }

                                output.push(name);
                                output.push(timeStr);
                                output.push(`[${weeks || ''}] ${weekMap[c - 1]}`);
                                output.push(cleanLocation(locRaw));
                                output.push(cleanTeacher(teacherRaw));
                            }
                        }
                    }
                }
            }
            return output.join('\n');
        }
    }

    // Register using Filename (湖南大学)
    if (window.AdapterRegistry) {
        window.AdapterRegistry.register('湖南大学', HNUAdapter);
    }
})();
