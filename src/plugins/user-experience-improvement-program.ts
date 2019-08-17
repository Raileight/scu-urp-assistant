// 用户体验改善计划插件
import { actions, Request, Submit, state } from '@/store'
import { CourseScorePublicInfo } from '@/store/types'
import local from '@/store/local'
import { logger, getCourseTeacherList } from '@/utils'
import { emitDataAnalysisEvent } from '@/plugins/data-analysis'
import { SemesterScoreRecord } from '@/plugins/score/types'

async function sendStudentCourseScorePublicList(
  records: SemesterScoreRecord[]
) {
  if (!state.getData('ueipStudentCourseScorePublicList')) {
    for (const s of records) {
      for (const c of s.courses) {
        c.courseTeacherList = await getCourseTeacherList(
          s.semester,
          c.courseNumber,
          c.courseSequenceNumber
        )
      }
    }
    const res = Object.values(records).map(v =>
      v.courses.map(
        ({
          courseName: course_name,
          courseNumber: course_number,
          courseScore: course_score,
          courseSequenceNumber: course_sequence_number,
          courseTeacherList: course_teacher_list,
          credit: credit,
          englishCourseName: english_course_name,
          examTime: exam_time,
          examTypeName: exam_type_name,
          executiveEducationPlanName: executive_education_plan_name,
          executiveEducationPlanNumber: executive_education_plan_number,
          gradePoint: grade_point,
          levelCode: level_code,
          levelName: level_name,
          studyHour: study_hour,
          unpassedReasonExplain: unpassed_reason_explain
        }) => ({
          course_name,
          course_number,
          course_score,
          course_sequence_number,
          course_teacher_list: course_teacher_list
            .map(v => Object.values(v).join('#'))
            .join('|'),
          credit,
          english_course_name,
          exam_time,
          exam_type_name,
          executive_education_plan_name,
          executive_education_plan_number,
          grade_point,
          level_code,
          level_name,
          study_hour,
          unpassed_reason_explain,
          user_id: state.user.id
        })
      )
    )
    try {
      for (const v of res) {
        await actions[Submit.STUDENT_COURSE_SCORE_PUBLIC_INFOS](v)
      }
      logger.log('isSubmittedSuccessfully!')
      state.setData('ueipStudentCourseScorePublicList', true)
      local.saveData(
        {
          key: 'ueipStudentCourseScorePublicList',
          payload: true
        },
        // 7天更新一次
        new Date().getTime() + 7 * 86400 * 1000
      )
      emitDataAnalysisEvent('UEIP-匿名用户课程成绩信息', '上传成功')
    } catch (error) {
      logger.error('Submit.STUDENT_COURSE_SCORE_PUBLIC_INFOS Failed!', error)
      emitDataAnalysisEvent('UEIP-匿名用户课程成绩信息', '上传失败')
    }
  }
}

async function sendCourseScorePublicList() {
  if (!state.getData('ueipCourseScorePublicList')) {
    const thisTermCourseScoreInfoList = await actions[
      Request.THIS_TERM_COURSE_SCORE_INFO_LIST
    ]()
    const courseScorePublicList: CourseScorePublicInfo[] = thisTermCourseScoreInfoList.map(
      ({
        courseName,
        englishCourseName,
        courseNumber,
        courseSequenceNumber,
        executiveEducationPlanNumber,
        executiveEducationPlanName,
        credit,
        examTime,
        examTypeName,
        studyHour,
        maxScore,
        avgScore,
        minScore
      }) => ({
        courseName,
        englishCourseName,
        courseNumber,
        courseSequenceNumber,
        executiveEducationPlanNumber,
        executiveEducationPlanName,
        credit,
        examTime,
        examTypeName,
        studyHour,
        maxScore: maxScore as number,
        avgScore: avgScore as number,
        minScore: minScore as number
      })
    )
    try {
      await actions[Submit.COURSE_SCORE_PUBLIC_INFOS](courseScorePublicList)
      state.setData('ueipCourseScorePublicList', true)
      local.saveData(
        {
          key: 'ueipCourseScorePublicList',
          payload: true
        },
        // 7天更新一次
        new Date().getTime() + 7 * 86400 * 1000
      )
      emitDataAnalysisEvent('UEIP-课程成绩信息', '上传成功')
    } catch (error) {
      logger.error('Submit.COURSE_SCORE_PUBLIC_INFOS Failed!', error)
      emitDataAnalysisEvent('UEIP-课程成绩信息', '上传失败')
    }
  }
}

export default {
  name: 'user-experience-improvement-program',
  pathname: true,
  async init() {
    sendCourseScorePublicList()
  }
}

export { sendCourseScorePublicList, sendStudentCourseScorePublicList }
