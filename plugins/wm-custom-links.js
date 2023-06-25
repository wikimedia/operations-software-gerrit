Gerrit.install(plugin => {
  plugin.hook('footer-left').onAttached(element => {

    element.appendChild(document.createTextNode(' | '));
    const codeOfConduct = element.appendChild(document.createElement('a'));
    codeOfConduct.style.color = 'var(--link-color)';
    codeOfConduct.href = 'https://www.mediawiki.org/wiki/Special:MyLanguage/Code_of_Conduct';
    codeOfConduct.textContent = 'Code of Conduct';

    element.appendChild(document.createTextNode(' | '));
    const privacyPolicy = element.appendChild(document.createElement('a'));
    privacyPolicy.style.color = 'var(--link-color)';
    privacyPolicy.href = 'https://wikimediafoundation.org/wiki/Special:MyLanguage/Privacy_policy';
    privacyPolicy.textContent = 'Privacy policy';

  });

  plugin.admin()
    .addMenuLink('Code Search', 'https://codesearch.wmcloud.org/search/');
});
