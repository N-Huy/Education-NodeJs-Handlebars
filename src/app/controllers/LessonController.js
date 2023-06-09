const mongoose = require("mongoose");
const Lesson = require("../models/Lesson");
const Theory = require("../models/Theory");
const Exercise = require("../models/Exercise");
const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Statistical = require("../models/Statistical");
const Result = require("../models/Result");
const slugify = require("slugify");
const readXlsxFile = require("read-excel-file/node");
const path = require("path");
const ObjectId = mongoose.Types.ObjectId;
class LessonController {


    // [GET]/lesson/:slug
    async show(req, res, next) {

        const lesson = await Lesson.findOne({ slug: req.params.slug });
        const theory = await Theory.find({ lessonID: lesson._id });


        res.render("lessons/show", {
            success: req.flash("success"),
            errors: req.flash("error"),
            lesson: mongooseToObject(lesson),
            theory: multipleMongooseToObject(theory),
        });
    }

    // [POST]/lessons/apiList
    async apiListLesson(req, res, next) {
        const idUnit = req.body.idUnit;
        const unit = await Unit.findById(ObjectId(idUnit));
        if(unit){

            const lessons = await Lesson.aggregate([
                { $match: { unitID: ObjectId(unit._id) } },
            ]);

            if(lessons){
                res.status(200).send(JSON.stringify(lessons))
            }
        }
    }

    // [GET]/lesson/:slug
    async show(req, res, next) {

        const lesson = await Lesson.findOne({ slug: req.params.slug });
        const theory = await Theory.find({ lessonID: lesson._id });


        res.render("lessons/show", {
            success: req.flash("success"),
            errors: req.flash("error"),
            lesson: mongooseToObject(lesson),
            theory: multipleMongooseToObject(theory),
        });
    }


    // [POST]/lesson/create
    async create(req, res) {
        const formLesson = req.body;
        const findLesson = await Lesson.findOne({ name: formLesson.name });
        if (findLesson) {
            req.flash(
                "error",
                "Bài học này đã tồn tại... Vui lòng nhập học này khác!"
            );
            res.redirect("back");
            return;
        }
        const lesson = new Lesson(req.body);
        await lesson.save();
        req.flash("success", "Thêm mới bài học thành công!");
        res.redirect("back");
    }

    //   [PUT]/lessons/:id
    async update(req, res) {
        const { name, lessonNumber, unitID } = req.body;
        const findLesson = await Lesson.findOne({ name: name });
        if (findLesson) {
            req.flash(
                "error",
                "Bài học này đã tồn tại... Vui lòng nhập học này khác!"
            );
            res.redirect("back");
            return;
        }
        await Lesson.updateOne(
            { _id: req.params.id },
            {
                name,
                lessonNumber,
                unitID,
                slug: slugify(name.toLowerCase()),
            }
        );
        req.flash("success", "Cập nhật bài học thành công !");
        res.redirect("back");
    }

    // [DELETE]/lessons/:id
    async delete(req, res) {
        const statisticals = await Statistical.find({
            lessonID: req.params.id,
        });

        if (statisticals.length > 0) {
            const statisticalsIdArr = statisticals.map(({ _id }) => _id);
            await Result.deleteMany({
                statisticalID: { $in: statisticalsIdArr },
            });
            await Statistical.deleteMany({ lessonID: req.params.id });
        }

        await Theory.deleteOne({ lessonID: req.params.id });
        await Exercise.deleteMany({ lessonID: req.params.id });
        await Lesson.deleteOne({ _id: req.params.id });

        req.flash("success", "Xóa thành công bài học!");
        res.redirect("back");
    }


    // [POST]/lesson/upload
    async upload(req, res) {
        try {
            if (req.file == undefined) {
                req.flash("error", "Vui lòng tải lên một tệp excel!");
                res.redirect("back");
                return;
            }
            let fileExcel = path.resolve(
                __dirname,
                "../../public/uploads/" + req.file.filename
            );

            readXlsxFile(fileExcel).then((rows) => {
                rows.shift();
                let lessons = [];

                rows.forEach((row) => {
                    let lesson = new Lesson({
                        lessonNumber: row[0],
                        name: row[1],
                        unitID: req.body.unitID,
                    });
                    lessons.push(lesson);
                });

                Lesson.create(lessons)
                    .then(() => {
                        req.flash("success", "Đã tải tệp lên thành công!");
                        res.redirect("back");
                    })
                    .catch((error) => {
                        req.flash(
                            "error",
                            "Không thể nhập dữ liệu vào cơ sở dữ liệu!"
                        );
                        res.redirect("back");
                    });
            });
        } catch (error) {
            console.log(error);
        }
    }

}
module.exports = new LessonController();