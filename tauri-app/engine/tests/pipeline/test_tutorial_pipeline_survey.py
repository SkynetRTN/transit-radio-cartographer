from radio_cartographer.survey import run_tutorial_survey_pipeline


def test_tutorial_pipeline_survey(inputs_dir):
    survey, img = run_tutorial_survey_pipeline(inputs_dir / "and0a.md2", inputs_dir / "cal25a.cal", align_offset=0.5, image_pix=1)
    assert len(survey.sweeps) > 0
    assert img.pixels.shape == (319, 399)
