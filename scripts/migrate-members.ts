import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// wiz_member 컬럼 순서 (원본 41개)
const COLUMNS = [
  "idx", "id", "passwd", "name", "photo", "icon", "nick", "resno",
  "email", "tphone", "hphone", "comtel", "homepage", "post",
  "address1", "address2", "reemail", "resms", "birthday", "bgubun",
  "marriage", "memorial", "scholarship", "job", "income", "car",
  "hobby", "consph", "conprd", "level", "recom", "visit", "visit_time",
  "intro", "memo", "addinfo1", "addinfo2", "addinfo3", "addinfo4",
  "addinfo5", "wdate",
];

const EMPTY_VALUES = new Set(["", "-", "--", "0000-00-00 00:00:00", "-0-0", ","]);

function parseRows(sql: string): string[][] {
  const match = sql.match(/INSERT INTO `wiz_member` VALUES\s*([\s\S]+?);/);
  if (!match) return [];

  const raw = match[1];
  const rows: string[][] = [];

  // 각 row 파싱: (...),(...)
  const rowRegex = /\(([^)]{10,})\)/g;
  let m: RegExpExecArray | null;

  while ((m = rowRegex.exec(raw)) !== null) {
    const row = m[1];
    // 문자열 내 쉼표를 무시하고 split
    const vals: string[] = [];
    let cur = "";
    let inStr = false;
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      if (ch === "'" && row[i - 1] !== "\\") {
        inStr = !inStr;
        i++;
        continue;
      }
      if (ch === "," && !inStr) {
        vals.push(cur.trim());
        cur = "";
        i++;
        continue;
      }
      cur += ch;
      i++;
    }
    vals.push(cur.trim());

    if (vals.length === COLUMNS.length) rows.push(vals);
  }

  return rows;
}

function toValue(raw: string): string | null {
  const v = raw.replace(/^'|'$/g, ""); // 따옴표 제거
  if (raw === "NULL" || EMPTY_VALUES.has(v)) return null;
  return v;
}

function toDateTime(raw: string): Date | null {
  const v = toValue(raw);
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function toInt(raw: string): number | null {
  const v = toValue(raw);
  if (!v) return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

async function main() {
  const sqlPath = path.join(process.cwd(), "db_backup_20260416.sql");
  console.log("SQL 파일 읽는 중...");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  console.log("wiz_member 데이터 파싱 중...");
  const rows = parseRows(sql);
  console.log(`파싱된 회원 수: ${rows.length}명`);

  let success = 0;
  let failed = 0;

  for (const vals of rows) {
    const get = (col: string) => vals[COLUMNS.indexOf(col)];

    try {
      await prisma.member.create({
        data: {
          idx:         toInt(get("idx"))!,
          id:          toValue(get("id"))!,
          passwd:      null,                          // 비밀번호 초기화
          name:        toValue(get("name")),
          photo:       toValue(get("photo")),
          icon:        toValue(get("icon")),
          nick:        toValue(get("nick")),
          // resno 제외
          email:       toValue(get("email")),
          tphone:      toValue(get("tphone")),
          hphone:      toValue(get("hphone")),
          comtel:      toValue(get("comtel")),
          homepage:    toValue(get("homepage")),
          post:        toValue(get("post")),
          address1:    toValue(get("address1")),
          address2:    toValue(get("address2")),
          reemail:     toValue(get("reemail")),
          resms:       toValue(get("resms")),
          birthday:    toValue(get("birthday")),
          bgubun:      toValue(get("bgubun")),
          marriage:    toValue(get("marriage")),
          memorial:    toValue(get("memorial")),
          scholarship: toValue(get("scholarship")),
          job:         toValue(get("job")),
          income:      toValue(get("income")),
          car:         toValue(get("car")),
          hobby:       toValue(get("hobby")),
          consph:      toValue(get("consph")),
          conprd:      toValue(get("conprd")),
          level:       toValue(get("level")),
          recom:       toValue(get("recom")),
          visit:       toInt(get("visit")),
          visitTime:   toDateTime(get("visit_time")),
          intro:       toValue(get("intro")),
          memo:        toValue(get("memo")),
          addinfo1:    toValue(get("addinfo1")),
          addinfo2:    toValue(get("addinfo2")),
          addinfo3:    toValue(get("addinfo3")),
          addinfo4:    toValue(get("addinfo4")),
          addinfo5:    toValue(get("addinfo5")),
          wdate:       toDateTime(get("wdate")),
        },
      });
      success++;
    } catch (e) {
      console.error(`실패 - id: ${toValue(get("id"))}`, e);
      failed++;
    }
  }

  console.log(`\n완료: 성공 ${success}명 / 실패 ${failed}명`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
