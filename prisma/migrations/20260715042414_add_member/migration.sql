-- CreateTable
-- 다른 팀원이 prisma db push(또는 직접 SQL)로 이미 운영 DB에 생성해둔 테이블을
-- 마이그레이션 이력에 맞춰 기록하기 위한 마이그레이션. IF NOT EXISTS로 작성하여
-- 테이블이 없는 환경(신규 로컬 DB 등)에서도 안전하게 적용된다.
CREATE TABLE IF NOT EXISTS "member" (
    "idx" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "passwd" TEXT,
    "name" TEXT,
    "photo" TEXT,
    "icon" TEXT,
    "nick" TEXT,
    "email" TEXT,
    "tphone" TEXT,
    "hphone" TEXT,
    "comtel" TEXT,
    "homepage" TEXT,
    "post" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "reemail" TEXT,
    "resms" TEXT,
    "birthday" TEXT,
    "bgubun" TEXT,
    "marriage" TEXT,
    "memorial" TEXT,
    "scholarship" TEXT,
    "job" TEXT,
    "income" TEXT,
    "car" TEXT,
    "hobby" TEXT,
    "consph" TEXT,
    "conprd" TEXT,
    "level" TEXT,
    "recom" TEXT,
    "visit" INTEGER,
    "visit_time" TIMESTAMP(3),
    "intro" TEXT,
    "memo" TEXT,
    "addinfo1" TEXT,
    "addinfo2" TEXT,
    "addinfo3" TEXT,
    "addinfo4" TEXT,
    "addinfo5" TEXT,
    "wdate" TIMESTAMP(3),

    CONSTRAINT "member_pkey" PRIMARY KEY ("idx")
);

-- CreateIndex
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'member_id_key'
  ) THEN
    CREATE UNIQUE INDEX "member_id_key" ON "member"("id");
  END IF;
END $$;
