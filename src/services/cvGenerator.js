const generateCvFromProfile = (profileData) => {
  const { profile, skills, work_experiences, projects, education } = profileData;

  let cvContent = ``;

  // --- Profile Section ---
  if (profile && profile.full_name) {
    cvContent += `${profile.full_name}
`;
    if (profile.email) cvContent += `${profile.email}
`;
    if (profile.phone) cvContent += `${profile.phone}
`;
    if (profile.linkedin_url) cvContent += `LinkedIn: ${profile.linkedin_url}
`;
    if (profile.github_url) cvContent += `GitHub: ${profile.github_url}
`;
    cvContent += `
`;
  }

  // --- Summary ---
  if (profile && profile.summary) {
    cvContent += `SUMMARY
`;
    cvContent += `-------
`;
    cvContent += `${profile.summary}

`;
  }

  // --- Skills ---
  if (skills && skills.length > 0) {
    cvContent += `SKILLS
`;
    cvContent += `-------
`;
    const groupedSkills = skills.reduce((acc, skill) => {
      (acc[skill.category] = acc[skill.category] || []).push(skill.name);
      return acc;
    }, {});

    for (const category in groupedSkills) {
      cvContent += `${category}: ${groupedSkills[category].join(', ')}
`;
    }
    cvContent += `
`;
  }

  // --- Work Experience ---
  if (work_experiences && work_experiences.length > 0) {
    cvContent += `WORK EXPERIENCE
`;
    cvContent += `---------------
`;
    work_experiences.forEach(exp => {
      cvContent += `${exp.title} at ${exp.company} (${exp.start_date} - ${exp.end_date || 'Present'})
`;
      if (exp.location) cvContent += `${exp.location}
`;
      if (exp.highlights && exp.highlights.length > 0) {
        exp.highlights.forEach(h => {
          cvContent += `  - ${h.highlight_text}
`;
        });
      }
      cvContent += `
`;
    });
  }

  // --- Projects ---
  if (projects && projects.length > 0) {
    cvContent += `PROJECTS
`;
    cvContent += `--------
`;
    projects.forEach(proj => {
      cvContent += `${proj.name}
`;
      if (proj.description) cvContent += `${proj.description}
`;
      if (proj.url) cvContent += `URL: ${proj.url}
`;
      if (proj.highlights && proj.highlights.length > 0) {
        proj.highlights.forEach(h => {
          cvContent += `  - ${h.highlight_text}
`;
        });
      }
      cvContent += `
`;
    });
  }

  // --- Education ---
  if (education && education.length > 0) {
    cvContent += `EDUCATION
`;
    cvContent += `---------
`;
    education.forEach(edu => {
      cvContent += `${edu.degree} in ${edu.field_of_study} from ${edu.institution}
`;
      if (edu.graduation_date) cvContent += `${edu.graduation_date}
`;
      cvContent += `
`;
    });
  }

  return cvContent.trim();
};

module.exports = { generateCvFromProfile };
